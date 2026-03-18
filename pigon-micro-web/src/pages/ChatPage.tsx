import { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import ChatService from "../services/chatservice";
import type { Message } from "../types/Message";
import type { userdata } from "../types/userdata";
import { KeyRingContext } from "../services/KeyRingProvider";
import getUserInfo from "../lib/auth/getUserInfo";

const ChatPage = () => {
    const params = useParams();
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    const [messages, setMessages] = useState<Message[]>([]);
    const [userInfo, setUserInfo] = useState<userdata>();

    // load userinfo
    useEffect(() => {
        getUserInfo().then((uinfo) => {
            setUserInfo(uinfo);
        })
    }, [])

    const krp = useContext(KeyRingContext);

    const sendMessageRef = useRef<((message: string) => void) | undefined>(undefined)

    // Load chatservice
    useEffect(() => {
        if (!krp) {
            console.log("Keyring provider not loaded")
            return;
        }

        if (!krp.masterKey) {
            console.warn("No masterKey in krp yet")
            return;
        }

        setLoading(true);
        setMessages([]);

        console.log("Loading chat service for chat: ", params.id)
        const chatProvider = new ChatService();
        chatProvider.init(krp.masterKey);
        console.log("Chat service loaded")
        chatProvider.addEventListener("message", (e) => {
            const { chatID, message, senderID, senderName } = e.detail;

            // message not related to this chat so we simply ignore it
            if (chatID.toString() != params.id) {
                return;
            }


            // message related to this chat
            console.log(senderID, message);
            setMessages(prev => [...prev, { senderID: senderID, chatID: chatID, senderName, date: new Date().toISOString(), message: message, type: "text" }]);
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
            setLoading(false);
        }).catch((err) => {
            console.error("Failed to get message history: ", err)
        })


        // TODO: move key rotation to a different place in the code
        // rotate keys every 10 minutes
        const rotateInterval = setInterval(() => {
            chatProvider.rotateKeys();
        }, 1000 * 60 * 10);

        (window as any).chpr = chatProvider

        return () => {
            console.log("Unloading chat service for chat: ", params.id)
            clearInterval(rotateInterval)
            chatProvider.unload();
        }
    }, [krp?.masterKey, params])

    const sendMsg = () => {
        if (!userInfo) {
            console.log("Message sending not allowed: userinfo not loaded.")
            return;
        }

        if (message.trim() === "") {
            return;
        }

        sendMessageRef.current?.(message);
        setMessages(prev => [...prev, { senderID: userInfo.ID, senderName: userInfo.username, chatID: parseInt(params.id as string), date: new Date().toISOString(), message: message, type: "text" }])
        setMessage("")
    }

    return <>
        <div className="message-display">
            {[...messages].reverse().map((msg) => <div className={`${msg.senderID == userInfo?.ID ? "mymessage" : "message"}`}>
                <span>{msg.senderName ? msg.senderName : msg.senderID}: {msg.message}</span>
            </div>)}
        </div>

        <form className="send-message" onSubmit={(e) => { e.preventDefault(); sendMsg }}>
            <input value={message} onChange={(e) => setMessage(e.target.value)} type="text" placeholder="Type your message here..." />
            <button onClick={sendMsg}>Send</button>
        </form>
        {loading && <div className="loading-popup">
            <h1>Loading...</h1>
        </div>}
    </>
}

export default ChatPage;