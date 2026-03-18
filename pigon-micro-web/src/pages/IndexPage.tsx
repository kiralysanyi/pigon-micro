import axios from "axios";
import { useEffect, useState } from "react";
import { BASEURL } from "../conf";
import getAccessToken from "../lib/auth/getAccessToken";
import { Outlet, useNavigate, useParams } from "react-router";
import type { userdata } from "../types/userdata";
import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/24/outline";
import getChatName from "../lib/chat/getChatName";
import logout from "../lib/auth/logout";
import type { Socket } from "socket.io-client";
import { getSocket } from "../lib/socket";

const IndexPage = () => {
    const [userdata, setUserdata] = useState<userdata>();
    const [chats, setChats] = useState<any[]>();
    const [chatName, setChatname] = useState("")

    const navigate = useNavigate();
    const params = useParams();
    const [connected, setConnected] = useState(false)
    useEffect(() => {
        let socket: Socket | undefined;
        const onConnect = () => {
            setConnected(true)
        }

        const onDisconnect = () => {
            setConnected(false)
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
            })

            // get chats

            axios.get(BASEURL + "/api/v1/chat", { headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } }).then((response) => {
                setChats(response.data.chats);
                console.log(response.data)
            }).catch((err) => {
                console.error("Failed to get chats: ", err)
            })

            // set socket
            const socket = await getSocket();
            setConnected(socket.connected);

            socket.on("connect", onConnect);
            socket.on("disconnect", onDisconnect);
        }).catch((err) => {
            console.error("Failed to initialize main page");
            if (err.response == undefined) {
                console.error("Network error")
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
                socket.off("disconnect", onDisconnect)
            }
        }


    }, [])

    useEffect(() => {
        if (params.id) {
            getChatName(parseInt(params.id)).then((cname) => {
                setChatname(cname);
            })
        }
    }, [params])

    return (userdata && connected == true) ? <>
        <div className="header">
            <div className="user-display">
                <span>{userdata?.username}</span>
                <ArrowLeftEndOnRectangleIcon className="logout" width={24} height={24} onClick={() => { logout().then(() => { navigate("/login") }) }} />
            </div>
            <div className="chat-header">
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
    </> : ""
}

export default IndexPage;