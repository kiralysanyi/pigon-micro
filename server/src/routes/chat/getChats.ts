import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { pool } from "../../utils/db/db";
import { RowDataPacket } from "mysql2";
import { getParticipants } from "../../utils/db/chat";

const getChats: RequestHandler = async (req: reqWithUserinfo, res) => {
    const sql = `SELECT ch.ID AS chatID, ch.type AS type, ch.name AS name FROM \`user-chats\` uc JOIN chats ch ON ch.ID = uc.chatId WHERE uc.userId = ?`

    try {
        const [result] = await pool.query<RowDataPacket[]>(sql, [req.userinfo.ID]);
        let chats = []
        // get participants, if its a direct chat then get the name of the other user and set it as chat name
        for (let i in result) {
            let chat = result[i];
            let participants = await getParticipants(chat.chatID);
            if (chat.type == "direct") {
                chat.name = participants.filter((p) => p.id != req.userinfo.ID)[0].username
            }

            chat.participants = participants;
            chats.push(chat);
        }

        return res.json({
            chats: chats
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to get chats, internal server error"
        })
    }

}

export default getChats;