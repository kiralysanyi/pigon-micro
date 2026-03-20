import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { checkUserInChat, getChatName, getChatType, getParticipants } from "../../utils/db/chat";

const getChatInfo: RequestHandler = async (req: reqWithUserinfo, res) => {
    const chatID = parseInt(req.params.id as string);

    // check permission
    if (!await checkUserInChat(req.userinfo.ID, chatID)) {
        return res.status(403).json({
            message: "You are not a participant in this chat"
        })
    }

    // get participants
    const participants = await getParticipants(chatID);
    const type = await getChatType(chatID);
    const name = await getChatName(chatID);

    // TODO: get more info

    return res.json({
        chat: {
            id: chatID,
            participants,
            type: type,
            name
        }
    })
}

export default getChatInfo;