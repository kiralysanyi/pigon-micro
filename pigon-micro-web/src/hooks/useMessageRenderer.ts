import { useEffect, useState } from "react";
import type ChatService from "../services/chatservice";
import type { Message } from "../types/Message";
import api from "../services/apiservice";
import { decryptFile } from "../lib/encryption/ecdh";
import { getFile, saveFile } from "../lib/indexedDB/fileDB";

// TODO: move file fetching and decryption logic to a separate hook or utility function, this will make the code cleaner and more reusable
// helper function to fetch and decrypt file, returns a blob url
const getDecryptedFile = async (toLoad: string, type: string, dKey: CryptoKey): Promise<string> => {

    try {
        const loadedFile = await getFile(toLoad);
        return URL.createObjectURL(loadedFile);
    } catch (error) {
        console.log("File not found in indexedDB, fetching from server: ", toLoad);
    }

    const response = await api.get(`/cdn/${toLoad}`, { responseType: "arraybuffer" });

    const decryptedFile: File = await decryptFile(response.data, dKey, type);
    const bUrl: string = URL.createObjectURL(decryptedFile);
    saveFile(toLoad, decryptedFile).then(() => {
        console.log("File saved to indexedDB for future use: ", toLoad);
    }).catch((err) => {
        console.error("Failed to save file to indexedDB: ", err);
    });

    return bUrl;
}

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