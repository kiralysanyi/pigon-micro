import axios from "axios";
import { useEffect, useState } from "react";
import { BASEURL } from "../conf";
import getAccessToken from "../lib/auth/getAccessToken";
import { socket } from "../lib/socket";
import { useNavigate } from "react-router";

const IndexPage = () => {
    const [userdata, setUserdata] = useState<string>();
    const [keys, setKeys] = useState<{ pubKey: string | null, privKey: string | null }>();

    const navigate = useNavigate();

    useEffect(() => {
        getAccessToken().then((token) => {
            axios.get(BASEURL + "/api/v1/auth/info", { headers: { "Authorization": `Bearer ${token}` } }).then((response) => {
                setUserdata(JSON.stringify(response.data.data))
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

    useEffect(() => {
        console.log("Connected: ", socket.connected)
    }, [socket.connected])

    return <>
        <h1>Das ist pigon</h1>
        {userdata && <p>Logged in as: {userdata}</p>}
        {keys && <p>Keys: {JSON.stringify(keys)}</p>}
    </>
}

export default IndexPage;