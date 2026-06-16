import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { pool } from "../../utils/db/db";
import { RowDataPacket } from "mysql2";
import { getParticipants } from "../../utils/db/chat";

const getChats: RequestHandler = async (req: reqWithUserinfo, res) => {
    const userId = req.userinfo.ID;
    // Query adds a boolean `hasUnread` field
    const sql = `
        SELECT 
            ch.ID AS chatID,
            ch.type AS type,
            ch.name AS name,
            EXISTS (
                SELECT 1 
                FROM messages m
                WHERE m.chatID = ch.ID
                  AND m.senderID != ?
                  AND m.created_at > uc.lastRead
            ) AS hasUnread,
            COALESCE(MAX(m2.created_at), uc.lastRead) AS lastActivity
        FROM \`user-chats\` uc
        JOIN chats ch ON ch.ID = uc.chatId
        LEFT JOIN messages m2 ON m2.chatID = ch.ID
        WHERE uc.userId = ?
        GROUP BY ch.ID, ch.type, ch.name, uc.lastRead
        ORDER BY lastActivity DESC
    `;

    try {
        const [result] = await pool.query<RowDataPacket[]>(sql, [userId, userId]);
        const chats = [];

        for (const chat of result) {
            // Get participants (existing logic)
            const participants = await getParticipants(chat.chatID);

            // cast 0/1 to true/false
            chat.hasUnread == 0 ? chat.hasUnread = false : chat.hasUnread = true;

            // For direct chats, set name to the other participant's username
            if (chat.type === "direct") {
                try {
                    const other = participants.find(p => p.id !== userId);
                    chat.name = other ? other.username : "Deleted user";
                } catch {
                    chat.name = "Deleted user";
                }
            }

            chat.participants = participants;
            // hasUnread is already present from the SQL query
            chats.push(chat);
        }

        return res.json({ chats });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to get chats, internal server error"
        });
    }
};

export default getChats;