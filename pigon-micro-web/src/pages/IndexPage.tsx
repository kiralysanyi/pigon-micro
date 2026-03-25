import axios from "axios";
import { useEffect, useState } from "react";
import { BASEURL } from "../conf";
import getAccessToken from "../lib/auth/getAccessToken";
import { Outlet, useNavigate, useParams } from "react-router";
import type { userdata } from "../types/userdata";
import { ArrowLeftEndOnRectangleIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import getChatName from "../lib/chat/getChatName";
import logout from "../lib/auth/logout";
import type { Socket } from "socket.io-client";
import { getSocket } from "../lib/socket";

const IndexPage = () => {
    const [userdata, setUserdata] = useState<userdata>();
    const [chats, setChats] = useState<any[]>();
    const [chatName, setChatname] = useState("");
    const [netError, setNetError] = useState(false);

    const navigate = useNavigate();
    const params = useParams();
    const [connected, setConnected] = useState(false)

    const updateChatList = async () => {
        axios.get(BASEURL + "/api/v1/chat", { headers: { "Authorization": `Bearer ${await getAccessToken()}`, "Content-Type": "application/json" } }).then((response) => {
            setChats(response.data.chats);
            console.log(response.data)
        }).catch((err) => {
            console.error("Failed to get chats: ", err)
        })
    }

    useEffect(() => {
        let socket: Socket | undefined;
        const onConnect = () => {
            setConnected(true)
        }

        const onDisconnect = () => {
            setConnected(false)
        }

        const onSockError = (data: any) => {
            console.error("Socket error: ", data)
            setNetError(true);
        }

        const onNewChat = () => {
            updateChatList();
        }

        getAccessToken().then(async (token) => {
            // get userinfo
            axios.get(BASEURL + "/api/v1/auth/info", { headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } }).then((response) => {
                setUserdata(response.data.data)
                console.log("Got user data: ", response.data.data)
                if (response.data.data.pubKey == null) {
                    navigate("/setup")
                }
            }).catch((error) => {
                console.error(error)
                setNetError(true)
            })

            // get chats
            updateChatList();

            // set socket
            const socket = await getSocket();
            setConnected(socket.connected);

            socket.on("connect", onConnect);
            socket.on("disconnect", onDisconnect);
            socket.on("connect_error", onSockError);
            socket.on("newchat", onNewChat);
        }).catch((err) => {
            console.error("Failed to initialize main page");
            if (err.response == undefined) {
                console.error("Network error")
                setNetError(true)
            }
        })

        const k = {
            pubKey: sessionStorage.getItem("pubKey"),
            privKey: sessionStorage.getItem("privKey")
        }

        if (k.privKey == null) {
            navigate("/unlock")
        }

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
                <Cog6ToothIcon width={24} height={24} onClick={() => navigate("/account")} style={{ cursor: "pointer" }} />
                <span>{userdata?.username}</span>
                <ArrowLeftEndOnRectangleIcon className="logout" width={24} height={24} onClick={() => { logout().then(() => { navigate("/login") }) }} />
            </div>
            <div className="chat-header" onClick={() => navigate("/settings/" + params.id)}>
                <span>Chat: {chatName}</span>
            </div>
        </div>
        <div className="sidebar">
            {/* Chat list render */}
            <div className="chatlist">
                {chats && chats.map((chat) => <div className={chat.chatID == parseInt(params.id as string) ? "focused" : ""} onClick={() => navigate("/chat/" + chat.chatID)}>
                    <span>{chat.name}</span>
                </div>)}
            </div>
            <div className="newchat" onClick={() => navigate("/newchat")}>Start new chat</div>
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