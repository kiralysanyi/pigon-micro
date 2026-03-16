import axios from "axios";
import { BASEURL } from "../../conf";
import getAccessToken from "./getAccessToken";

const logout = (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        axios.post(BASEURL + "/api/v1/auth/logout", {}, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getAccessToken()}` } }).then(() => {
            sessionStorage.clear();
            localStorage.clear();
            resolve();
        }).catch((err) => {
            console.error("Failed to log out: ", err)
            reject(err)
        })
    })
}

export default logout;