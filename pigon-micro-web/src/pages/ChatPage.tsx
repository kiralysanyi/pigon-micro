import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import ChatService from "../services/chatservice";

const ChatPage = () => {
    const params = useParams();
    const [message, setMessage] = useState("");

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
        })

        console.log(chatProvider.sendMessage)

        const smsg = (message: string) => {
            chatProvider.sendMessage(message, parseInt(params.id as string))
            console.log("Sending")
        }

        sendMessageRef.current = smsg;

        return () => {
            console.log("Unloading chat service for chat: ", params.id)
            chatProvider.unload();
        }
    }, [])

    return <div style={{ paddingTop: "5rem" }}>
        <h1>Chat: {params.id}</h1>
        <div className="input-group">
            <input value={message} onChange={(e) => setMessage(e.target.value)} type="text" placeholder="msg" />
            <button onClick={() => sendMessageRef.current?.(message)}>Send</button>
        </div>
    </div>
}

export default ChatPage;