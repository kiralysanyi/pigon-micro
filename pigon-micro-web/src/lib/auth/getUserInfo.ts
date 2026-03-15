import axios from "axios";
import type { userdata } from "../../types/userdata";
import getAccessToken from "./getAccessToken";
import { BASEURL } from "../../conf";

const getUserInfo = (userID?: number): Promise<userdata> => {
    return new Promise((resolve, reject) => {
        getAccessToken().then((token) => {
            let url = "/api/v1/auth/info";
            if (userID != undefined) {
                url += "?id=" + userID
            }
            
            axios.get(BASEURL + url, { headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } }).then((response) => {
                resolve(response.data.data)
            }).catch((error) => {
                console.error(error)
                reject(error)
            })
        })
    });
}

export default getUserInfo;