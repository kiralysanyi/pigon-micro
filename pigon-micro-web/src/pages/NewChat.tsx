import { useContext, useEffect, useState } from "react";
import type { userdataBrief } from "../types/userdataBrief";
import axios from "axios";
import { BASEURL } from "../conf";
import getAccessToken from "../lib/auth/getAccessToken";
import { useNavigate } from "react-router";
import { generateECDHKeyPair } from "../lib/encryption/ecdh";

const NewChat = () => {
    const [users, setUsers] = useState<userdataBrief[]>()
    const navigate = useNavigate();

    const [groupMode, setGroupMode] = useState(false);
    const [chatname, setChatname] = useState("");

    const [error, setError] = useState<string>();

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAccessToken().then((token) => {
            axios.get(BASEURL + "/api/v1/auth/users", { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }).then((response) => {
                setUsers(response.data.users)
                setLoading(false);
                console.log(response.data.users)
            }).catch((err) => {
                console.error("Failed to fetch users")
                if (err.response) {
                    console.error(err.response.data)
                    if (err.response.status == 401) {
                        console.error("Unauthorized")
                        navigate("/login")
                    }
                }
            })
        })
    }, [])

    const startChat = (userId: number) => {
        getAccessToken().then((token) => {
            setLoading(true);
            console.log("Start new chat with user: ", userId)
            axios.post(BASEURL + "/api/v1/chat", { targetID: userId }, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }).then((response) => {
                console.log(response.data)
                navigate("/")
            }).catch((err) => {
                setLoading(false);
                console.error("Failed to create chat: ", err)
                if (err.response) {
                    setError(err.response.data.message)
                }
            })

        })
    }

    const createGroup = () => {
        setLoading(true);
        getAccessToken().then((token) => {
            axios.post(BASEURL + "/api/v1/chat/group", { chatName: chatname }, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }).then(async (response) => {
                console.log("Group created");
                // create and upload initial keys
                const keypair = await generateECDHKeyPair();
                //navigate("/")
            }).catch((err) => {
                setLoading(false);
                if (err.response) {
                    setError(err.response.data.message)
                } else {
                    setError("Unknown error, check console")
                }
                console.error(err, err.response)
            })
        })
    }

    return <>
        <div className="modal">
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
            <button onClick={() => navigate("/")}>Cancel</button>
        </div>
    </>
}

export default NewChat;