import { useEffect, useState } from "react";
import type ChatService from "../services/chatservice";
import type { Message } from "../types/Message";
import api from "../services/apiservice";
import { decryptFile } from "../lib/encryption/ecdh";

const useMessageRenderer = (chatProvider: ChatService | undefined, cID: number) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (chatProvider == undefined) {
            return
        }
        setLoading(true);
        setMessages([]);

        chatProvider.addEventListener("message", (e) => {
            const { chatID, message, senderID, senderName, type } = e.detail;

            // message not related to this chat so we simply ignore it
            if (chatID != cID) {
                return;
            }


            // message related to this chat
            console.log(senderID, message);
            setMessages(prev => [...prev, { senderID: senderID, chatID: chatID, senderName, date: new Date(), message: message, type: type }]);
        })

        // get message history
        chatProvider.getMessageHistory(cID).then((pastMessages) => {

            console.log("Got decrypted message history: ", pastMessages)
            setMessages(pastMessages);
            // dynamically load files for messages with toLoad field
            pastMessages.forEach(async (msg, i) => {
                if (msg.toLoad && msg.dKey) {
                    const response = await api.get(`/cdn/${msg.toLoad}`, { responseType: "arraybuffer" });

                    const decryptedFile: File = await decryptFile(response.data, msg.dKey, msg.type);
                    const bUrl: string = URL.createObjectURL(decryptedFile);
                    pastMessages[i].message = bUrl;
                    pastMessages[i].dKey = undefined; // free memory
                    pastMessages[i].toLoad = undefined; // free memory
                    setMessages([...pastMessages]);
                }
            })
            setLoading(false);
        }).catch((err) => {
            console.error("Failed to get message history: ", err)
        })

        return () => {
            // cleanup event listeners
            chatProvider.removeEventListener("message", () => { })
        }
    }, [chatProvider])

    return { messages, setMessages, loading }

}

export default useMessageRenderer;