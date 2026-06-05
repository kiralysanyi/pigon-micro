import getUserInfo from "../auth/getUserInfo";
import api from "../../services/apiservice";

const getChatName = async (chatID: number): Promise<string> => {
    const userinfo = await getUserInfo();
    try {
        const response = await api.get("/chat/" + chatID);
        if (response.data.chat.name) {
            return response.data.chat.name;
        }
        const participants = response.data.chat.participants as any[];
        return participants.filter((p) => p.id != userinfo.ID)[0].username;
    } catch (err) {
        console.error("Failed to get chat name: ", err);
        throw err;
    }
}

export default getChatName;