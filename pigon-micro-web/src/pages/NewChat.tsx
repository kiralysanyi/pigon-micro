import { useContext, useEffect, useState } from "react";
import type { userdataBrief } from "../types/userdataBrief";
import { useNavigate } from "react-router";
import { deriveSharedKey, ecdhEncryptKey } from "../lib/encryption/ecdh";
import { KeyRingContext } from "../services/KeyRingProvider";
import getUserInfo from "../lib/auth/getUserInfo";
import { generateMasterKey } from "../lib/encryption/masterkey";
import api from "../services/apiservice";

const NewChat = () => {
    const [users, setUsers] = useState<userdataBrief[]>()
    const navigate = useNavigate();

    const [groupMode, setGroupMode] = useState(false);
    const [chatname, setChatname] = useState("");

    const [error, setError] = useState<string>();

    const [loading, setLoading] = useState(true);

    const krp = useContext(KeyRingContext);

    useEffect(() => {
        api.get("/auth/users").then((response) => {
            setUsers(response.data.users)
            setLoading(false);
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

    }, [])

    const startChat = async (userId: number) => {

        setLoading(true);
        console.log("Start new chat with user: ", userId)
        try {
            const response = await api.post("/chat", { targetID: userId });
            console.log(response.data)
            window.dispatchEvent(new CustomEvent("api:info", { detail: { message: "Chat created successfully" } }))
            navigate("/", { viewTransition: true })
        } catch (err: any) {
            setLoading(false);
            console.error("Failed to create chat: ", err)
            if (err.response) {
                setError(err.response.data.message)
            }
        }


    }

    const createGroup = async () => {
        setLoading(true);
        if (krp == undefined || krp.privKey == undefined || krp.pubKey == undefined) {
            setLoading(false);
            setError("Key initialization failure")
            return;
        }
        try {
            const response = await api.post("/chat/group", { chatName: chatname });
            console.log("Group created");
            // create and upload initial keys
            const chatID = response.data.chatID;
            const user = await getUserInfo();

            // generate chat key
            const chatKey = await generateMasterKey();

            // get the key to encrypt the chat key
            const sharedKey = await deriveSharedKey(krp.privKey as CryptoKey, krp.pubKey as CryptoKey)

            // encrypt chat key
            const encryptedKey = await ecdhEncryptKey(chatKey, sharedKey);

            // upload
            const keyResponse = await api.post("/keyring/groupkeys/" + chatID, { targetUserId: user.ID, encryptedKey });
            console.log(keyResponse.data);
            window.dispatchEvent(new CustomEvent("api:info", { detail: { message: "Group created successfully" } }))
            navigate(`/chat/${chatID}`, { viewTransition: true })
        } catch (err: any) {
            setLoading(false);
            if (err.response) {
                setError(err.response.data.message)
            } else {
                setError("Unknown error, check console")
            }
            console.error(err, err.response)
        }

    }

    return <>
        <div className="modal">
            {loading && <span>Loading...</span>}
            {error && <div className="modal-error">{error}</div>}
            {groupMode ? <>
                <h1>Create new Group</h1>
                <div className="form-group">
                    <label htmlFor="chatname">Group name</label>
                    <input onChange={(e) => setChatname(e.target.value)} type="text" name="chatname" id="chatname" placeholder="Name of the group" />
                    <button onClick={createGroup} disabled={chatname.length == 0}>Create Group</button>
                </div>
            </> : <>
                <h1>Start new chat</h1>
                <span>Select user to start new chat with</span>
                {!users && <span>Loading user list...</span>}
                <div className="modal-list">
                    {users && users.map(user => <div onClick={() => startChat(user.id)} className="list-element">
                        <span>{user.username}</span>
                    </div>)}
                </div>
            </>}
            <button onClick={() => setGroupMode(!groupMode)}>{groupMode ? "Start private chat instead" : "Create new group instead"}</button>
            <button onClick={() => navigate("/", { viewTransition: true })}>Cancel</button>
        </div>
    </>
}

export default NewChat;