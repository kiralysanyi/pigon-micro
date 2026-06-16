import { useContext, useEffect, useRef, useState } from "react";
import { BASEURL } from "../conf";
import { Outlet, useNavigate, useParams } from "react-router";
import type { userdata } from "../types/userdata";
import { ArrowLeftEndOnRectangleIcon, Bars3Icon, Cog6ToothIcon, PhoneArrowDownLeftIcon, PhoneArrowUpRightIcon, PhoneIcon } from "@heroicons/react/24/outline";
import logout from "../lib/auth/logout";
import type { Socket } from "socket.io-client";
import { getSocket } from "../lib/socket";
import api from "../services/apiservice";
import getUserInfo from "../lib/auth/getUserInfo";
import { KeyRingContext } from "../services/KeyRingProvider";
import type { ChatinfoBrief } from "../types/ChatinfoBrief";
import getUsernameById from "../lib/auth/getUsernameById";
import { clearKeys } from "../lib/indexedDB/keyDB";
import ringtone from "../assets/ringtone.mp3";
import GlassButton from "../components/GlassButton";
import { LiquidGlass } from "@liquidglass/react";
import getUserIdForCall from "../lib/call/getUserIdForCall";
import { useDebounce } from "../hooks/useDebounce";
import type { EncryptedMessage } from "../types/EncryptedMessage";

const IndexPage = () => {
    const [userdata, setUserdata] = useState<userdata>();
    const [chats, setChats] = useState<ChatinfoBrief[]>();

    const [filteredChats, setFilteredChats] = useState<ChatinfoBrief[]>();
    const [searchText, setSearchText] = useState<string>("");
    const searchQuery = useDebounce(searchText, 1000);

    const [netError, setNetError] = useState(false);
    const [selectedChat, setSelectedChat] = useState<ChatinfoBrief>();

    const navigate = useNavigate();
    const params = useParams();
    const [connected, setConnected] = useState(false);
    const [hideSidebar, setHideSidebar] = useState(false);
    const krp = useContext(KeyRingContext);
    const [handleCall, setHandleCall] = useState<(accept: boolean) => void>();
    const [incomingCall, setIncomingCall] = useState<{ from: string, socketId: string } | undefined>(undefined)
    const ringtoneRef = useRef<HTMLAudioElement>(null);
    const [pfpId, setPfpId] = useState<number | undefined>(undefined);

    const updateChatList = async () => {
        api.get("/chat").then((response) => {
            setChats(response.data.chats);
            console.log(response.data)
        }).catch((err) => {
            console.error("Failed to get chats: ", err)
        })
    }

    const reorderChats = (chatId: number, setUnread = false) => {
        setChats((prev) => {
            if (!prev) {
                return prev;
            }
            const i = prev.findIndex(chat => chat.chatID == chatId);
            prev[i].hasUnread = setUnread;
            const nChats = [...prev];
            const [chat] = nChats.splice(i, 1);
            nChats.unshift(chat);
            return nChats;
        })
    }

    // set pfp id
    useEffect(() => {
        if (selectedChat) {
            if (selectedChat.type == "direct") {
                getUserIdForCall(selectedChat.chatID).then((id) => {
                    setPfpId(id);
                }).catch(() => { setPfpId(0) })
            } else {
                setPfpId(undefined)
            }
        } else {
            setPfpId(undefined)
        }
    }, [selectedChat])

    useEffect(() => {
        let socket: Socket | undefined;
        const onConnect = () => {
            console.log("Connected")
            setConnected(true)
        }

        const onDisconnect = () => {
            console.log("Disconnected")
            setConnected(false)
        }

        const onSockError = (data: any) => {
            console.error("Socket error: ", data)
            setNetError(true);
        }

        const onNewChat = () => {
            updateChatList();
        }

        const onRing = async (data: any, cb: (res: { accepted: boolean, socketId: string }) => void) => {
            console.log("Ringing: ", data);
            setIncomingCall({ from: await getUsernameById(data.userId), socketId: data.socketId })
            if (!socket) {
                console.error("Refused call: no socket")
                cb({ accepted: false, socketId: "" })
                return;
            }

            if (socket.id == undefined) {
                console.error("Refused call: no socket id")
                cb({ accepted: false, socketId: "" })
                return;
            }

            setHandleCall(() => (accept: boolean) => {
                console.log("Accepted call?", accept)
                if (accept == undefined) {
                    return;
                }
                setHandleCall(undefined)
                if (!socket) {
                    console.error("Refused call: no socket")
                    cb({ accepted: false, socketId: "" })
                    return;
                }

                if (socket.id == undefined) {
                    console.error("Refused call: no socket id")
                    cb({ accepted: false, socketId: "" })
                    return;
                }
                cb({ accepted: accept, socketId: socket.id })
                if (accept == true) {
                    navigate(`/chat/${data.chatId}/call?remoteId=${data.socketId}`)
                }
            })
        }

        const onRingEnd = () => {
            console.log("Ring ended");
            setIncomingCall(undefined);
            setHandleCall(undefined);
        }

        // order chats on incoming messages
        const onMessage = (data: EncryptedMessage) => {
            reorderChats(data.chatID, true)
        }

        // order chats on message sending
        const onMessageSend = (e: any) => {
            reorderChats(e.detail.chatId, false);
        }
        (async () => {

            // get userinfo
            getUserInfo().then((info) => {
                setUserdata(info);
            }).catch((err) => {
                console.log(err)
                setNetError(true)
            })

            // get chats
            updateChatList();

            // set socket
            socket = await getSocket();
            setConnected(socket.connected);

            socket.on("connect", onConnect);
            socket.on("disconnect", onDisconnect);
            socket.on("connect_error", onSockError);
            socket.on("newchat", onNewChat);
            socket.on("ring", onRing);
            socket.on("ring-end", onRingEnd);
            socket.on("message", onMessage);
            window.addEventListener("chat:msgsend", onMessageSend);
            setConnected(true)
        })()
        return () => {
            if (socket) {
                socket.off("connect", onConnect);
                socket.off("disconnect", onDisconnect);
                socket.off("connect_error", onSockError);
                socket.off("newchat", onNewChat);
                socket.off("ring", onRing);
                socket.off("ring-end", onRingEnd);
                socket.off("message", onMessage);
            }
        }


    }, [])

    useEffect(() => {
        if (params.id && chats) {
            setHideSidebar(true);
            setSelectedChat(chats?.filter((chat) => chat.chatID.toString() == params.id)[0])
        }
    }, [params, chats])

    useEffect(() => {
        if (incomingCall) {
            ringtoneRef.current?.play();
        }

        return () => {
            ringtoneRef.current?.pause();
            if (ringtoneRef.current) {
                ringtoneRef.current.currentTime = 0
            }
        }
    }, [incomingCall])


    // chat search
    useEffect(() => {
        if (searchQuery === "") {
            setFilteredChats(undefined)
            return;
        }

        if (chats) {
            setFilteredChats(chats.filter((chat) => chat.name.toLowerCase().includes(searchQuery.toLowerCase())));
        }

    }, [searchQuery, chats])

    const markRead = (chatId: number) => {
        setChats((prev) => {
            if (prev) {
                return prev.map((chat) => {
                    if (chat.chatID == chatId) {
                        chat.hasUnread = false;
                    }
                    return chat;
                })
            }

            return prev
        })
    }


    return (userdata && connected == true) ? <>
        <audio ref={ringtoneRef} playsInline src={ringtone} />
        {incomingCall ? <div className="call-popup">
            <span>Incoming call from: {incomingCall.from}</span>
            <div className="action">
                <button className="accept-btn" onClick={() => handleCall?.(true)}><PhoneArrowUpRightIcon width={24} height={24} /></button>
                <button className="decline-btn" onClick={() => handleCall?.(false)}><PhoneArrowDownLeftIcon width={24} height={24} /></button>
            </div>
        </div> : ""}
        <div className={`header ${hideSidebar ? "header-focus" : ""}`}>
            <div className="user-display">
                <LiquidGlass className="user-glass" blur={1}>
                    <Bars3Icon className="menuicon icon" onClick={() => setHideSidebar(!hideSidebar)} width={24} height={24} />
                    <Cog6ToothIcon className={`${hideSidebar ? "mobilehidden" : ""} icon`} width={24} height={24} onClick={() => navigate("/account", { viewTransition: true })} style={{ cursor: "pointer" }} />
                    <span className={hideSidebar ? "mobilehidden" : ""}>{userdata?.username}</span>
                    <ArrowLeftEndOnRectangleIcon className={`${hideSidebar ? "mobilehidden" : ""} icon`} width={24} height={24} onClick={() => {
                        logout().then(() => {
                            clearKeys();
                            // Clear keys then navigate to login
                            krp?.setMasterKey(undefined);
                            krp?.setPrivKey(undefined);
                            krp?.setPubKey(undefined);
                            navigate("/login", { viewTransition: true })
                        })
                    }} />
                </LiquidGlass>
            </div>
            {selectedChat?.name && <div className={`chat-header ${hideSidebar ? "" : "mobilehidden"}`} onClick={() => { if (pfpId != 0) { navigate("/settings/" + params.id, { viewTransition: true }) } }}>
                <LiquidGlass blur={1} displacementScale={1} borderRadius={999}>
                    <div className="ch-glass">
                        {(pfpId != undefined && pfpId != 0) && <img src={`${BASEURL}/auth/pfp/${pfpId}`}></img>}
                        <b>{selectedChat.name}</b>
                    </div>
                </LiquidGlass>
            </div>}
            {(selectedChat?.type == "direct" && pfpId != 0) && <GlassButton className={`callbtn ${hideSidebar ? "" : "mobilehidden"}`} onClick={() => navigate(`/chat/${params.id}/call`)}>
                <PhoneIcon width={24} height={24} />
            </GlassButton>}
        </div>
        <div className={`sidebar ${hideSidebar ? "sidebar-hidden" : ""}`}>
            {/* Chat list render */}

            <div className="chatlist">
                <input type="search" placeholder="Search users" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                {filteredChats ? <>
                    {/* Filtered chats */}
                    {filteredChats.map((chat) => <div className={chat.chatID == parseInt(params.id as string) ? "focused" : ""} onClick={() => { markRead(chat.chatID); navigate("/chat/" + chat.chatID, { viewTransition: true }); setHideSidebar(true) }}>
                        {chat.type === "direct" && <img src={`${BASEURL}/auth/pfp/${chat.participants.find((p: any) => p.id !== userdata.ID)?.id ?? 0}`} />}<span>{chat.name}</span>
                        {chat.hasUnread && <span className="unread-indicator"></span>}
                    </div>)}
                </> : <>
                    {/* Unfiltered chats */}
                    {chats ? chats.map((chat) => <div className={chat.chatID == parseInt(params.id as string) ? "focused" : ""} onClick={() => { markRead(chat.chatID); navigate("/chat/" + chat.chatID, { viewTransition: true }); setHideSidebar(true) }}>
                        {chat.type === "direct" && <img src={`${BASEURL}/auth/pfp/${chat.participants.find((p: any) => p.id !== userdata.ID)?.id ?? 0}`} />}<span>{chat.name}</span>
                        {chat.hasUnread && <span className="unread-indicator"></span>}
                    </div>) : <div className="horizontal-loader"></div>}</>}
            </div>
            <div className="newchat" onClick={() => navigate("/newchat", { viewTransition: true })}>Start new chat</div>
        </div>
        <div className="chat-main-container">
            <Outlet />
        </div>
    </> : <>
        <div className="modal">
            {netError ? <>
                <h1>Network error</h1>
                <button className="btn" onClick={() => location.reload()}>Retry</button></> : <h1>Loading</h1>}
        </div>
    </>
}

export default IndexPage;