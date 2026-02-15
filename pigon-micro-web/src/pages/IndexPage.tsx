import axios from "axios";
import { useEffect, useState } from "react";
import { BASEURL } from "../conf";
import getAccessToken from "../lib/auth/getAccessToken";

const IndexPage = () => {
    const [userdata, setUserdata] = useState<string>();

    useEffect(() => {
        getAccessToken().then((token) => {
            axios.get(BASEURL + "/api/v1/auth/info", { headers: { "Authorization": `Bearer ${token}` } }).then((response) => {
                setUserdata(JSON.stringify(response.data.data))
                console.log("Got user data: ", response.data.data)
            }).catch((error) => {
                console.error(error)
            })
        }).catch(() => {
            console.error("Failed to get access token")
        })
    }, [])

    return <>
        <h1>Das ist pigon</h1>
        {userdata && <p>Logged in as: {userdata}</p>}
    </>
}

export default IndexPage;