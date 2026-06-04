import api from "../../services/apiservice";
import getUserInfo from "../auth/getUserInfo";

const getUserIdForCall = (chatId: string | number) => {
    return new Promise<number>(async (resolve, reject) => {
        const userinfo = await getUserInfo();
        api.get("/chat/" + chatId).then((response) => {
            if (response.data.chat.type != "direct") {
                console.error("Chat is not a direct chat, call aborted");
                return;
            }
            const participants = response.data.chat.participants as any[];
            console.log(participants)
            const userToCall: number = participants.filter((p) => p.id != userinfo.ID)[0].id;
            resolve(userToCall)

        }).catch((err) => {
            console.error("Failed to get target userid ", err);
            reject(err);
        })
    })
}

export default getUserIdForCall;