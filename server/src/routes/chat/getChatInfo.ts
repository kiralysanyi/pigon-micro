import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { checkUserInChat, getChatName, getChatType, getParticipants } from "../../utils/db/chat";
import { pool } from "../../utils/db/db";
import { RowDataPacket } from "mysql2";

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
    pool.query<RowDataPacket[]>("SELECT type, name, creator AS creatorId FROM chats WHERE ID = ?", [chatID], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Internal server error"
            })
        }

        return res.json({
            chat: {
                id: chatID,
                participants,
                type: result[0].type,
                name: result[0].name,
                creatorId: result[0].creatorId
            }
        })
    })
}

export default getChatInfo;