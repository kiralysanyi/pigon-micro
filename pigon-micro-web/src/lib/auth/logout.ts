import api from "../../services/apiservice";
import { clearUserInfoCache } from "./getUserInfo";

const logout = (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        api.post("/auth/logout", {}).then(() => {
            sessionStorage.clear();
            localStorage.clear();
            clearUserInfoCache();
            resolve();
        }).catch((err) => {
            console.error("Failed to log out: ", err)
            reject(err)
        })
    })
}

export default logout;