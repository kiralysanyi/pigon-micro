import axios from "axios";
import { useEffect, useState } from "react";
import { BASEURL } from "../conf";
import getAccessToken from "../lib/auth/getAccessToken";
import { Outlet, useNavigate } from "react-router";
import type { userdata } from "../types/userdata";
import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/24/outline";

const IndexPage = () => {
    const [userdata, setUserdata] = useState<userdata>();
    const [keys, setKeys] = useState<{ pubKey: string | null, privKey: string | null }>();

    const navigate = useNavigate();

    useEffect(() => {
        getAccessToken().then((token) => {
            axios.get(BASEURL + "/api/v1/auth/info", { headers: { "Authorization": `Bearer ${token}` } }).then((response) => {
                setUserdata(response.data.data)
                console.log("Got user data: ", response.data.data)
                if (response.data.data.pubKey == null) {
                    navigate("/setup")
                }
            }).catch((error) => {
                console.error(error)
            })
        }).catch(() => {
            console.error("Failed to get access token")
        })

        const k = {
            pubKey: sessionStorage.getItem("pubKey"),
            privKey: sessionStorage.getItem("privKey")
        }

        if (k.privKey == null) {
            navigate("/unlock")
        }

        setKeys(k)
    }, [])

    return <>
        <div className="header">
            <div className="user-display">
                <span>{userdata?.username}</span>
                <ArrowLeftEndOnRectangleIcon className="logout" width={24} height={24}/>
            </div>
        </div>
        <div className="sidebar">
            {/* Chat list render */}
        </div>
        <div className="chat-main-container">
            <Outlet />
        </div>
    </>
}

export default IndexPage;