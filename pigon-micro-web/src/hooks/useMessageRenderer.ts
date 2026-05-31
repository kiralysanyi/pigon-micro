import { useEffect, useState } from "react";
import type ChatService from "../services/chatservice/chatservice";
import type { Message } from "../types/Message";
import getDecryptedFile from "../lib/encryption/file/getDecryptedFile";

const useMessageRenderer = (chatProvider: ChatService | undefined, cID: number) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (chatProvider == undefined) {
            return
        }
        setLoading(true);
        setMessages([]);

        chatProvider.addEventListener("message", async (e) => {
            const { chatID, message, senderID, senderName, type, toLoad, dKey } = e.detail;

            // message not related to this chat so we simply ignore it
            if (chatID != cID) {
                return;
            }


            // message related to this chat
            console.log(senderID, message);
            setMessages(prev => [...prev, { senderID: senderID, chatID: chatID, senderName, date: new Date(), message: message, type: type, toLoad }]);

            if (toLoad && dKey) {
                const bUrl = await getDecryptedFile(toLoad, type, dKey);
                setMessages(prev => prev.map(msg => {
                    if (msg.toLoad == toLoad) {
                        return { ...msg, message: bUrl, dKey: undefined, toLoad: undefined }
                    }
                    return msg;
                }));
            }
        })

        // get message history
        chatProvider.getMessageHistory(cID).then((pastMessages) => {

            console.log("Got decrypted message history: ", pastMessages)
            setMessages(pastMessages);
            // dynamically load files for messages with toLoad field
            pastMessages.forEach(async (msg, i) => {
                if (msg.toLoad && msg.dKey) {
                    const bUrl = await getDecryptedFile(msg.toLoad, msg.type, msg.dKey);
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