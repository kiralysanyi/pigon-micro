import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import ChatService from "../services/chatservice";
import type { Message } from "../types/Message";
import type { userdata } from "../types/userdata";

const ChatPage = () => {
    const params = useParams();
    const [message, setMessage] = useState("");

    const [messages, setMessages] = useState<Message[]>([]);
    const [userInfo, setUserInfo] = useState<userdata>();

    const sendMessageRef = useRef<((message: string) => void) | undefined>(undefined)

    // Load chatservice
    useEffect(() => {
        console.log("Loading chat service for chat: ", params.id)
        const chatProvider = new ChatService();
        chatProvider.init();
        console.log("Chat service loaded")
        chatProvider.addEventListener("message", (e) => {
            const { chatID, message, senderID } = e.detail;

            // message not related to this chat so we simply ignore it
            if (chatID.toString() != params.id) {
                return;
            }


            // message related to this chat
            console.log(senderID, message);
            setMessages(prev => [...prev, { senderID: senderID, chatID: chatID, date: new Date().toISOString(), message: message, type: "text" }]);
        })

        console.log(chatProvider.sendMessage)

        const smsg = async (message: string) => {
            console.log("Sending")
            await chatProvider.sendMessage(message, parseInt(params.id as string))
            console.log("Sent")
        }

        sendMessageRef.current = smsg;

        // get message history

        chatProvider.getMessageHistory(parseInt(params.id as string)).then((pastMessages) => {
            console.log("Got decrypted message history: ", pastMessages)
            setMessages(pastMessages)
        }).catch((err) => {
            console.error("Failed to get message history: ", err)
        })

        return () => {
            console.log("Unloading chat service for chat: ", params.id)
            chatProvider.unload();
        }
    }, [])

    const sendMsg = () => {
        sendMessageRef.current?.(message);
        setMessages(prev => [...prev, { senderID: 0, chatID: parseInt(params.id as string), date: new Date().toISOString(), message: message, type: "text" }])
    }

    return <div>
        <div className="message-display">
            {[...messages].reverse().map((msg) => <div>
                <span>{msg.senderName? msg.senderName : msg.senderID}: {msg.message}</span>
            </div>)}
        </div>
        <div className="send-message">
            <input value={message} onChange={(e) => setMessage(e.target.value)} type="text" placeholder="msg" />
            <button onClick={sendMsg}>Send</button>
        </div>
    </div>
}

export default ChatPage;