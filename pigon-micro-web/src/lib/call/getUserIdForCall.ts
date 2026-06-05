import api from "../../services/apiservice";
import getUserInfo from "../auth/getUserInfo";

const getUserIdForCall = async (chatId: string | number) => {
    const userinfo = await getUserInfo();
    try {
        const response = await api.get("/chat/" + chatId);
        if (response.data.chat.type != "direct") {
            console.error("Chat is not a direct chat, call aborted");
            return;
        }
        const participants = response.data.chat.participants as any[];
        const userToCall: number = participants.filter((p) => p.id != userinfo.ID)[0].id;
        return userToCall;
    } catch (err) {
        console.error("Failed to get target userid ", err);
        throw err;
    }
}

export default getUserIdForCall;