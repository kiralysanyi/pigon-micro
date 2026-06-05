import type { userdata } from "../../types/userdata";
import api from "../../services/apiservice";

let userInfoCache: Record<number, userdata> = {}

const getUserInfo = async (userID?: number): Promise<userdata> => {
    if (userID == undefined && userInfoCache[0] != undefined) {
        return userInfoCache[0];
    }

    if (userID && userInfoCache[userID] != undefined) {
        return userInfoCache[userID];
    }

    let url = "/auth/info";
    if (userID != undefined) {
        url += "?id=" + userID
    }

    try {
        const response = await api.get(url);
        if (userID == undefined) {
            userInfoCache[0] = response.data.data;
        } else {
            userInfoCache[userID] = response.data.data
        }
        return response.data.data;
    } catch (error) {
        console.error(error)
        throw error;
    }
}

export const clearUserInfoCache = () => { userInfoCache = {} }

export default getUserInfo;