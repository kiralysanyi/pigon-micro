import type { userdata } from "../../types/userdata";
import api from "../../services/apiservice";

let userInfoCache: Record<number, userdata> = {}

const getUserInfo = (userID?: number): Promise<userdata> => {
    return new Promise((resolve, reject) => {
        if (userID == undefined && userInfoCache[0] != undefined) {
            resolve(userInfoCache[0]);
            return;
        }

        if (userID && userInfoCache[userID] != undefined) {
            resolve(userInfoCache[userID]);
            return;
        }

        let url = "/api/v1/auth/info";
        if (userID != undefined) {
            url += "?id=" + userID
        }

        api.get(url).then((response) => {
            if (userID == undefined) {
                userInfoCache[0] = response.data.data;
            } else {
                userInfoCache[userID] == response.data.data
            }
            resolve(response.data.data)
        }).catch((error) => {
            console.error(error)
            reject(error)
        })
    });
}

export default getUserInfo;