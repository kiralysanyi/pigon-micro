import { useEffect, useRef, useState } from "react";
import type ChatService from "../services/chatservice/chatservice";
import type { Message } from "../types/Message";
import getDecryptedFile from "../lib/encryption/file/getDecryptedFile";

const useMessageRenderer = (chatProvider: ChatService | undefined, cID: number) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const currentPageRef = useRef(0);
    const reachedEndRef = useRef(false);
    const getHistory = () => {
        if (chatProvider == undefined) {
            return;
        }
        setLoading(true);
        // get message history
        console.log("Getting chat page: ", currentPageRef.current)
        chatProvider.getMessageHistory(cID, currentPageRef.current).then((pastMessages) => {

            if (currentPageRef.current == 0) {
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
            } else {
                if (reachedEndRef.current == true) {
                    setLoading(false);
                    return;
                }

                if (pastMessages.length == 0) {
                    setLoading(false)
                    reachedEndRef.current = true;
                    return;
                }
                console.log("Append")
                setMessages(prev => [...pastMessages, ...prev]);
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
            }

        }).catch((err) => {
            console.error("Failed to get message history: ", err)
        })
    }

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
            setMessages(prev => [...prev, { senderID: senderID, chatID: chatID, senderName, date: new Date(), message: message, type: type, toLoad, status: "ok" }]);

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

        getHistory();

        return () => {
            // cleanup event listeners
            chatProvider.removeEventListener("message", () => { })
        }
    }, [chatProvider])

    const loadNextPage = () => {
        if (reachedEndRef.current == true) {
            console.warn("Reached end of chat")
            return;
        }
        currentPageRef.current += 1;
        getHistory();
    }

    const clearState = () => {
        console.log("Clear state!")
        reachedEndRef.current = false;
        currentPageRef.current = 0;
    }

    return { messages, setMessages, loading, loadNextPage, clearState }

}

export default useMessageRenderer;