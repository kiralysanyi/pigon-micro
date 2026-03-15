import type { userdata } from "../../types/userdata";
import getUserInfo from "./getUserInfo"

const getUsernameById = (userID: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const saved = localStorage.getItem("usrcache" + userID);

        if (saved != null) {
            const parsed = JSON.parse(saved) as userdata;
            return resolve(parsed.username);
        }

        getUserInfo(userID).then((data) => {
            // cache to localstorage
            // TODO: move it to a more performant storage solution
            localStorage.setItem("usrcache" + userID, JSON.stringify(data))
            resolve(data.username)
        }).catch((err) => {
            console.error("Failed to get username: ", userID, err);
            reject(err);
        })
    })
}

export default getUsernameById;