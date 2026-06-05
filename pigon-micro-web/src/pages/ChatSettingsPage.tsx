import { useContext, useEffect, useState } from "react";
import type { chatinfo } from "../types/chatinfo";
import { useNavigate, useParams } from "react-router";
import getChatName from "../lib/chat/getChatName";
import { ArrowLeftCircleIcon } from "@heroicons/react/24/outline";
import type { userdata } from "../types/userdata";
import getUserInfo from "../lib/auth/getUserInfo";
import type { userdataBrief } from "../types/userdataBrief";
import { getGroupEncryptKey } from "../services/keyservice";
import { KeyRingContext } from "../services/KeyRingProvider";
import { deriveSharedKey, ecdhEncryptKey } from "../lib/encryption/ecdh";
import { importECDHPublicKeyFromBase64 } from "../lib/encryption/utils";
import api from "../services/apiservice";

const ChatSettingsPage = () => {
    const [chat, setChat] = useState<chatinfo>();
    const params = useParams();
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState<userdata>();
    const [showApModal, setShowApModal] = useState(false);
    const [users, setUsers] = useState<userdataBrief[]>();
    const krp = useContext(KeyRingContext);

    const addUser = async (id: number) => {
        if (!krp || !krp.privKey) {
            console.error("Krp not initialized!", krp)
            return;
        }

        if (!chat) {
            console.error("No chat data")
            return;
        }

        try {
            await api.post(`/chat/group/${chat?.id}/user/${id}`, {});
            console.log("User added, adding key");
            // add key for target user
            // group chat key
            const { key, kGuid } = await getGroupEncryptKey(chat.id, krp.privKey as CryptoKey, true);
            console.log("Got key: ", kGuid)
            // freshly added participant's public key
            const encodedPKey = (await api.get(`/keyring/pubKey?userID=${id}`)).data.data.pubKey
            console.log(encodedPKey)

            const remotePubKey = await importECDHPublicKeyFromBase64(encodedPKey)
            // key to encrypt group key
            const sharedKey = await deriveSharedKey(krp.privKey as CryptoKey, remotePubKey);

            // encrypted key for transit
            const encryptedKey = await ecdhEncryptKey(key, sharedKey)

            await api.post(`/keyring/groupkeys/${chat.id}`, { targetUserId: id, encryptedKey, kGuid });
            setShowApModal(false)
            window.dispatchEvent(new CustomEvent("api:info", { detail: { message: "User added" } }));
        } catch (err) {
            console.error(err);
        }
    }

    const getChatInfo = async () => {
        try {
            console.log(params.id)
            const response = await api.get(`/chat/${params.id}`);
            let data = response.data.chat;
            console.log(response.data)
            if (data.name == undefined) {
                data.name = await getChatName(data.id)
            }
            setChat(data)

            setUserInfo(await getUserInfo())
        } catch (error) {
            console.error(error);
        }
    }

    const removeUser = async (id: number) => {
        if (!chat) {
            console.error("No chat data")
            return;
        }

        try {
            await api.delete(`/chat/group/${chat?.id}/user/${id}`);
            console.log("User removed");
            window.dispatchEvent(new CustomEvent("api:info", { detail: { message: "User removed" } }));
            await getChatInfo();
        } catch (err) {
            console.error(err);
        }
    }

    const deleteChat = () => {
        api.delete(`/chat/${chat?.id}`).then(() => {
            navigate("/")
        }).catch((err) => {
            console.error(err)
        })
    }


    useEffect(() => {
        if (!showApModal) {
            getChatInfo();
            setUsers(undefined);
            return;
        }


        api.get("/auth/users").then((response) => {
            setUsers(response.data.users)
            console.log(response.data.users)
        }).catch((err) => {
            console.error("Failed to fetch users")
            if (err.response) {
                console.error(err.response.data)
                if (err.response.status == 401) {
                    console.error("Unauthorized")
                    navigate("/login", { viewTransition: true })
                }
            }
        })
    }, [showApModal])

    // TODO: if chat type is direct then show the user's info
    return <>
        {showApModal ? <div className="modal">
            <button onClick={() => setShowApModal(false)}><ArrowLeftCircleIcon width={24} height={24} /> Go back</button>
            <h1>Add participant</h1>
            <div className="modal-list">
                {users?.map((u) => <div onClick={() => addUser(u.id)} className="list-element">
                    {u.username}
                </div>)}
            </div>
        </div> : <div className="modal">
            <button onClick={() => navigate("/chat/" + params.id)}><ArrowLeftCircleIcon width={24} height={24} /> Go back</button>
            <h1>Chat settings</h1>
            <h2>{chat?.type}:{chat?.name} | {chat?.creatorId}:{userInfo?.ID}</h2>
            {chat?.type == "group" && <>
                <span>Participants</span>
                <div className="modal-list">
                    {chat?.participants.map((p) => <div className="list-element">
                        <span style={{ marginRight: "auto" }}>{p.username}</span>
                        {userInfo?.ID != p.id ? userInfo?.ID == chat?.creatorId && <button onClick={(e) => { e.stopPropagation(); removeUser(p.id) }} style={{ marginLeft: "auto" }}>Remove</button> : <span style={{ fontSize: "1.3rem", fontWeight: "bold", color: "gray" }}>You</span>}
                    </div>)}
                </div>
                {userInfo?.ID == chat?.creatorId && <button onClick={() => setShowApModal(true)}>Add participant</button>}
                {userInfo?.ID == chat?.creatorId && <button style={{ backgroundColor: "rgb(50,0,0)" }} onClick={() => deleteChat()}>Delete group</button>}
            </>}
        </div>}
    </>
}

export default ChatSettingsPage;