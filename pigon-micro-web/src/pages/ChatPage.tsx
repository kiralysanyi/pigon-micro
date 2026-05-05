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

    const sendMessageRef = useRef<((message: string) => void) | undefined>(undefined);
    const sendFileRef = useRef<(() => void) | undefined>(undefined);

    // Load chatservice
    useEffect(() => {
        if (!krp) {
            console.log("Keyring provider not loaded")
            return;
        }

        if (!krp.masterKey || !krp.privKey) {
            console.warn("No masterKey | privkey in krp yet")
            return;
        }

        setLoading(true);
        setMessages([]);

        console.log("Loading chat service for chat: ", params.id)
        const chatProvider = new ChatService();
        chatProvider.init(krp.masterKey, krp.privKey);
        console.log("Chat service loaded")
        chatProvider.addEventListener("message", (e) => {
            const { chatID, message, senderID, senderName, type } = e.detail;

            // message not related to this chat so we simply ignore it
            if (chatID.toString() != params.id) {
                return;
            }


            // message related to this chat
            console.log(senderID, message);
            setMessages(prev => [...prev, { senderID: senderID, chatID: chatID, senderName, date: new Date(), message: message, type: type }]);
        })

        console.log(chatProvider.sendMessage)

        const smsg = async (message: string) => {
            console.log("Sending")
            await chatProvider.sendMessage(message, parseInt(params.id as string))
            console.log("Sent")
        }

        sendMessageRef.current = smsg;
        sendFileRef.current = async () => {
            try {
                const data = await chatProvider.sendFile(parseInt(params.id as string))
                if (!userInfo) {
                    return;
                }
                setMessages(prev => [...prev, { senderID: userInfo.ID, senderName: userInfo.username, chatID: parseInt(params.id as string), date: new Date(), message: data.url, type: data.type }])
            } catch (error) {
                console.error(error);
                window.alert(error);
            }
        }

        // get message history

        chatProvider.getMessageHistory(parseInt(params.id as string)).then((pastMessages) => {
            console.log("Got decrypted message history: ", pastMessages)
            setMessages(pastMessages)
            setLoading(false);
        }).catch((err) => {
            console.error("Failed to get message history: ", err)
        })


        // TODO: move key rotation to a different place in the code
        // rotate keys
        chatProvider.rotateKeys();
        // Call rotatekeys every minute, the function will only rotate if required
        const rotateInterval = setInterval(() => {
            chatProvider.rotateKeys();
        }, 1000 * 60);

        (window as any).chpr = chatProvider

        return () => {
            console.log("Unloading chat service for chat: ", params.id)
            clearInterval(rotateInterval)
            chatProvider.unload();
        }
    }, [krp?.masterKey, params, krp?.privKey])

    const sendMsg = () => {
        if (!userInfo) {
            console.log("Message sending not allowed: userinfo not loaded.")
            return;
        }

        if (message.trim() === "") {
            return;
        }

        sendMessageRef.current?.(message);
        setMessages(prev => [...prev, { senderID: userInfo.ID, senderName: userInfo.username, chatID: parseInt(params.id as string), date: new Date(), message: message, type: "text" }])
        setMessage("")
    }

    return <>
        <div className="message-display">
            {[...messages].reverse().map((msg) => <div className={`${msg.senderID == userInfo?.ID ? "mymessage" : "message"}`}>
                <span className="sname">{msg.senderName}</span>
                {msg.type == "text" && <span className="msg">{msg.message}</span>}
                {msg.type == "image" && <img src={msg.message}></img>}
                {msg.type == "video" && <video src={msg.message} controls></video>}
                <span className="mdate">{msg.date.getHours()}:{msg.date.getMinutes()}</span>
            </div>)}
        </div>

        <form className="send-message" onSubmit={(e) => { e.preventDefault(); sendMsg() }}>
            <input value={message} onChange={(e) => setMessage(e.target.value)} type="text" placeholder="Type your message here..." />
            <button onClick={sendFileRef.current}>Send file</button>
            <button onClick={sendMsg}>Send</button>
        </form>
        {loading && <div className="loading-popup">
            <h1>Loading...</h1>
        </div>}
    </>
}

export default ChatPage;