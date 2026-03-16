import axios from "axios";
import { BASEURL } from "../../conf";
import getAccessToken from "../auth/getAccessToken";
import getUserInfo from "../auth/getUserInfo";

const getChatName = (chatID: number): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        const userinfo = await getUserInfo();
        axios.get(BASEURL + "/api/v1/chat/" + chatID, {headers: {"Content-Type": "application/json", Authorization: `Bearer ${await getAccessToken()}`}}).then((response) => {
            const participants = response.data.chat.participants as any[];
            resolve(participants.filter((p) => p.id != userinfo.ID)[0].username)
        }).catch((err) => {
            console.error("Failed to get chat name: ", err);
            reject(err)
        })
    })
}

export default getChatName;