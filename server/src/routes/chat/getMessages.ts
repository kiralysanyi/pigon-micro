import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { checkUserInChat } from "../../utils/db/chat";
import { pool } from "../../utils/db/db";
import { RowDataPacket } from "mysql2";

const getMessages: RequestHandler = async (req: reqWithUserinfo, res) => {
    const chatID = parseInt(req.params.chatID as string);

    // check permission
    if (!await checkUserInChat(req.userinfo.ID, chatID)) {
        return res.status(403).json({
            message: "You do not have permission to access the messages of this chat"
        })
    }

    // get messages
    pool.query<RowDataPacket[]>("SELECT ID as messageID, chatID, senderID, type, message AS payload, senderKeyId, recipientKeyId, created_at AS date FROM messages WHERE chatID = ? LIMIT 50", [chatID], (err, result) => {
        if (err) {
            console.error("Failed to get messages for chat: ", chatID);
            console.error(err)
            return res.status(500).json({
                message: "Internal server error"
            })
        }

        return res.json({
            messages: result
        })
    })
}

export default getMessages;