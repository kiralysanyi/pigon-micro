import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { checkUserInChat } from "../../utils/db/chat";
import { pool } from "../../utils/db/db";
import { RowDataPacket } from "mysql2";

const getMessages: RequestHandler = async (req: reqWithUserinfo, res) => {
    const chatID = parseInt(req.params.chatID as string);
    const pageSize = 100
    let offset = 0;

    if (req.query.page) {
        try {
            const requestedPage: number = parseInt(req.query.page as string)
            if (requestedPage == 0) {
                offset = 0;
            } else {
                offset = pageSize * requestedPage
            }
        } catch (error) {
            return res.status(400).json({
                message: "Page parameter has to be a number"
            })
        }
    }


    // check permission
    if (!await checkUserInChat(req.userinfo.ID, chatID)) {
        return res.status(403).json({
            message: "You do not have permission to access the messages of this chat"
        })
    }

    // get messages
    try {
        const [result] = await pool.query<RowDataPacket[]>("SELECT ID as messageID, chatID, senderID, type, message AS payload, senderKeyId, recipientKeyId, kGuid, created_at AS date FROM messages WHERE chatID = ? ORDER BY ID DESC LIMIT ? OFFSET ?", [chatID, pageSize, offset])
        result.reverse();

        // write lastread column in user-chats connection table if offset is 0
        if (offset == 0) {
            await pool.query("UPDATE `user-chats` SET lastRead = CURRENT_TIMESTAMP() WHERE chatId = ? AND userId = ?", [chatID, req.userinfo.ID]);
        }

        return res.json({
            messages: result
        })
    } catch (err) {
        console.error("Failed to get messages for chat: ", chatID);
        console.error(err)
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}

export default getMessages;