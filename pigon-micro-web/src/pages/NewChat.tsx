import { useEffect, useState } from "react";
import type { userdataBrief } from "../types/userdataBrief";
import axios from "axios";
import { BASEURL } from "../conf";
import getAccessToken from "../lib/auth/getAccessToken";
import { useNavigate } from "react-router";

const NewChat = () => {
    const [users, setUsers] = useState<userdataBrief[]>()
    const navigate = useNavigate();

    const [error, setError] = useState<string>()

    useEffect(() => {
        getAccessToken().then((token) => {
            axios.get(BASEURL + "/api/v1/auth/users", { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }).then((response) => {
                setUsers(response.data.users)
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
            console.log("Start new chat with user: ", userId)
            axios.post(BASEURL + "/api/v1/chat", { targetID: userId }, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }).then((response) => {
                console.log(response.data)
                navigate("/")
            }).catch((err) => {
                console.error("Failed to create chat: ", err)
                if (err.response) {
                    setError(err.response.data.message)
                }
            })

        })
    }

    return <>
        <div className="modal">
            <h1>Start new chat</h1>
            {error && <div className="modal-error">{error}</div>}
            <span>Select user to start new chat with</span>
            {!users && <span>Loading user list...</span>}
            <div className="modal-list">
                {users && users.map(user => <div onClick={() => startChat(user.id)} className="list-element">
                    <span>{user.username}</span>
                </div>)}
            </div>
            <button onClick={() => navigate("/")}>Cancel</button>
        </div>
    </>
}

export default NewChat;