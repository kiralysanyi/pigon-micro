import getUserInfo from "../auth/getUserInfo";
import api from "../../services/apiservice";

const getChatName = (chatID: number): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        const userinfo = await getUserInfo();
        api.get("/api/v1/chat/" + chatID).then((response) => {
            if (response.data.chat.name) {
                return resolve(response.data.chat.name);
            }
            const participants = response.data.chat.participants as any[];
            resolve(participants.filter((p) => p.id != userinfo.ID)[0].username)
        }).catch((err) => {
            console.error("Failed to get chat name: ", err);
            reject(err)
        })
    })
}

export default getChatName;