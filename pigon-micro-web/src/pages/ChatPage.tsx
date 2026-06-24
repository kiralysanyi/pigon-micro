import { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import ChatService from "../services/chatservice/chatservice";
import type { userdata } from "../types/userdata";
import { KeyRingContext } from "../services/KeyRingProvider";
import getUserInfo from "../lib/auth/getUserInfo";
import useMessageRenderer from "../hooks/useMessageRenderer";
import { PaperAirplaneIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import formatMsgDate from "../lib/formatMsgDate";
import { LiquidGlass } from "@liquidglass/react";
import GlassButton from "../components/GlassButton";


const ChatPage = () => {
    const params = useParams();
    const [message, setMessage] = useState("");
    const [chatProvider, setChatProvider] = useState<ChatService>();

    const { messages, setMessages, loading, loadNextPage, clearState } = useMessageRenderer(chatProvider, parseInt(params.id as string));
    const [userInfo, setUserInfo] = useState<userdata>();


    useEffect(() => {
        return () => clearState();
    }, [params])

    // load userinfo
    useEffect(() => {
        getUserInfo().then((uinfo) => {
            setUserInfo(uinfo);
        })
    }, [])

    const krp = useContext(KeyRingContext);

    const sendMessageRef = useRef<((message: string) => Promise<number>) | undefined>(undefined);
    const sendFileRef = useRef<(() => void) | undefined>(undefined);

    // Load chatservice
    useEffect(() => {
        if (!userInfo) {
            console.log("Userinfo not loaded yet");
            return;
        }

        if (!krp) {
            console.log("Keyring provider not loaded")
            return;
        }

        if (!krp.masterKey || !krp.privKey) {
            console.warn("No masterKey | privkey in krp yet")
            return;
        }


        console.log("Loading chat service for chat: ", params.id)
        const chatProvider = new ChatService();
        chatProvider.init(krp.masterKey, krp.privKey);
        console.log("Chat service loaded");
        setChatProvider(chatProvider)

        console.log(chatProvider.sendMessage)

        const smsg = async (message: string): Promise<number> => {
            console.log("Sending")
            try {
                return await chatProvider.sendMessage(message, parseInt(params.id as string))
            } catch (error) {
                console.error("Failed to send message");
                throw "err_msg_send_failed"
            }
        }

        sendMessageRef.current = smsg;
        sendFileRef.current = async () => {
            try {
                if (!userInfo) {
                    return;
                }

                const localUID = window.crypto.randomUUID();

                setMessages(prev => [...prev, { senderID: userInfo.ID, senderName: userInfo.username, chatID: parseInt(params.id as string), date: new Date(), message: "Sending file...", type: "text", status: "sending", localId: localUID }])

                try {
                    const data = await chatProvider.sendFile(parseInt(params.id as string), (messageId: number) => {
                        console.log("Sent file with id:", messageId)
                        console.log("File sent, got url: ", data.url);
                        setMessages(prev => prev.map((msg) => msg.localId == localUID ? { ...msg, status: "sent", type: data.type, message: data.url, ID: messageId } : msg))
                    });
                } catch (error) {
                    if (error == "No file selected") {
                        setMessages(prev => prev.filter(msg => msg.localId !== localUID));
                        return;
                    }
                    if (typeof error == "string") {
                        window.dispatchEvent(new CustomEvent("api:error", { detail: { message: error } }));
                    }
                    setMessages(prev => prev.map((msg) => msg.localId == localUID ? { ...msg, status: "failed", type: "text", message: "Failed to send file" } : msg))
                    setTimeout(() => {
                        setMessages(prev => prev.filter(msg => msg.localId !== localUID));
                    }, 2000);
                }

            } catch (error) {
                console.error(error);
                window.dispatchEvent(new CustomEvent("api:error", { detail: { message: error } }));
            }
        }

        return () => {
            console.log("Unloading chat service for chat: ", params.id)
            chatProvider.unload();
        }
    }, [krp?.masterKey, params, krp?.privKey, userInfo])

    const sendMsg = async () => {
        if (!userInfo) {
            console.log("Message sending not allowed: userinfo not loaded.")
            return;
        }

        if (message.trim() === "") {
            return;
        }

        const localUID = window.crypto.randomUUID();
        setMessages(prev => [...prev, { senderID: userInfo.ID, senderName: userInfo.username, chatID: parseInt(params.id as string), date: new Date(), message: message, type: "text", status: "sending", localId: localUID }])

        try {
            const srvMessageId = await sendMessageRef.current?.(message);
            // set state by uuid to sent
            setMessages((prev) => prev.map(msg => msg.localId == localUID ? { ...msg, status: "sent", ID: srvMessageId } : msg))

        } catch (error) {
            // set state by uuid to failed
            setMessages((prev) => prev.map(msg => msg.localId == localUID ? { ...msg, status: "failed" } : msg))
        }


        setMessage("")
    }

    const scrollHandler: React.UIEventHandler<HTMLDivElement> = (e) => {
        const target = e.currentTarget;
        if (Math.abs(target.scrollTop) > target.scrollHeight - 1000) {
            loadNextPage();
        }
    }

    return <>
        <div className="message-display" onScroll={scrollHandler}>
            {[...messages].reverse().map((msg) => <div className={`${msg.senderID == userInfo?.ID ? "mymessage" : "message"} ${msg.status == "failed" ? "message-failed" : ""}`}>
                <span className="sname">{msg.senderName}</span>
                {msg.message ? <>
                    {msg.type == "text" && <span className="msg">{msg.message}</span>}
                    {msg.type == "image" && <img src={msg.message}></img>}
                    {msg.type == "video" && <video src={msg.message} controls></video>}
                </> : <div className="spinner"></div>}
                <span className="mdate"> {formatMsgDate(msg.date)}</span>
                {((msg.senderID == userInfo?.ID) && (msg.status != "ok")) && <span className="mstatus">{msg.status}</span>}
            </div>)}
        </div>

        <form className="send-message" onSubmit={(e) => { e.preventDefault(); sendMsg() }}>
            <LiquidGlass borderRadius={999} shadowIntensity={1} brightness={0.5} displacementScale={0.5} blur={1}>
                <input value={message} onChange={(e) => setMessage(e.target.value)} type="text" placeholder="Type your message here..." />
            </LiquidGlass>
            <GlassButton onClick={sendFileRef.current}><PlusCircleIcon width={24} height={24} /></GlassButton>
            <GlassButton onClick={sendMsg}><PaperAirplaneIcon width={24} height={24} /></GlassButton>
        </form>
        {loading && <div className="loading-popup">
            <div className="horizontal-loader"></div>
        </div>}
    </>
}

export default ChatPage;