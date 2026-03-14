import axios from "axios";
import type { userdata } from "../../types/userdata";
import getAccessToken from "./getAccessToken";
import { BASEURL } from "../../conf";

const getUserInfo = (): Promise<userdata> => {
    return new Promise((resolve, reject) => {
        getAccessToken().then((token) => {
            axios.get(BASEURL + "/api/v1/auth/info", { headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } }).then((response) => {
                resolve(response.data)
            }).catch((error) => {
                console.error(error)
                reject(error)
            })
        })
    });
}

export default getUserInfo;