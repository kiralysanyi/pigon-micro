import { useContext, useEffect, useState } from "react";
import { BASEURL } from "../conf";
import { Outlet, useNavigate, useParams } from "react-router";
import type { userdata } from "../types/userdata";
import { ArrowLeftEndOnRectangleIcon, Bars3Icon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import getChatName from "../lib/chat/getChatName";
import logout from "../lib/auth/logout";
import type { Socket } from "socket.io-client";
import { getSocket } from "../lib/socket";
import api from "../services/apiservice";
import getUserInfo from "../lib/auth/getUserInfo";
import { KeyRingContext } from "../services/KeyRingProvider";

const IndexPage = () => {
    const [userdata, setUserdata] = useState<userdata>();
    const [chats, setChats] = useState<any[]>();
    const [chatName, setChatname] = useState("");
    const [netError, setNetError] = useState(false);

    const navigate = useNavigate();
    const params = useParams();
    const [connected, setConnected] = useState(false);
    const [hideSidebar, setHideSidebar] = useState(true);
    const krp = useContext(KeyRingContext)

    const updateChatList = async () => {
        api.get("/chat").then((response) => {
            setChats(response.data.chats);
            console.log(response.data)
        }).catch((err) => {
            console.error("Failed to get chats: ", err)
        })
    }

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
            setConnected(true)
        })()
        return () => {
            if (socket) {
                socket.off("connect", onConnect);
                socket.off("disconnect", onDisconnect);
                socket.off("connect_error", onSockError);
                socket.off("newchat", onNewChat);
            }
        }


    }, [])

    useEffect(() => {
        if (params.id) {
            getChatName(parseInt(params.id)).then((cname) => {
                setChatname(cname);
            }).catch(() => {
                // Probbably just a group
            })
        }
    }, [params])

    return (userdata && connected == true) ? <>
        <div className="header">
            <div className="user-display">
                <Bars3Icon className="menuicon icon" onClick={() => setHideSidebar(!hideSidebar)} width={24} height={24} />
                <Cog6ToothIcon className={`${hideSidebar ? "mobilehidden" : ""} icon`} width={24} height={24} onClick={() => navigate("/account", { viewTransition: true })} style={{ cursor: "pointer" }} />
                <span className={hideSidebar ? "mobilehidden" : ""}>{userdata?.username}</span>
                <ArrowLeftEndOnRectangleIcon className={`${hideSidebar ? "mobilehidden" : ""} icon`} width={24} height={24} onClick={() => {
                    // TODO: move this to a hook
                    logout().then(() => {
                        // Clear keys then navigate to login
                        krp?.setMasterKey(undefined);
                        krp?.setPrivKey(undefined);
                        krp?.setPubKey(undefined);
                        navigate("/login", { viewTransition: true })
                    })
                }} />
            </div>
            <div className={`chat-header ${hideSidebar ? "" : "mobilehidden"}`} onClick={() => navigate("/settings/" + params.id, { viewTransition: true })}>
                <span>Chat: {chatName}</span>
            </div>
        </div>
        <div className={`sidebar ${hideSidebar ? "sidebar-hidden" : ""}`}>
            {/* Chat list render */}
            <div className="chatlist">
                {chats && chats.map((chat) => <div className={chat.chatID == parseInt(params.id as string) ? "focused" : ""} onClick={() => { navigate("/chat/" + chat.chatID, { viewTransition: true }); setHideSidebar(true) }}>
                    {chat.type == "direct" && <img src={`${BASEURL}/auth/pfp/${chat.participants.filter((p: any) => p.id != userdata.ID)[0].id}`} />}
                    <span>{chat.name}</span>
                </div>)}
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