import { RowDataPacket } from "mysql2";
import { pool } from "./db";

const getParticipants = async (chatID: number): Promise<RowDataPacket[]> => {
    try {
        const sql = `SELECT users.ID AS id, users.username AS username, users.pubKey AS pubKey
        FROM \`user-chats\` 
        LEFT JOIN users ON \`user-chats\`.userId = users.ID 
        WHERE \`user-chats\`.chatId = ?;`;
        const [result] = await pool.promise().query<RowDataPacket[]>(sql, [chatID]);
        return result;
    } catch (error) {
        throw error;
    }
}


const checkUserInChat = async (userId: number, chatId: number): Promise<boolean> => {
    try {
        const sql = `SELECT 1 FROM \`user-chats\` WHERE userId = ? AND chatId = ?`
        const [result] = await pool.promise().query(sql, [userId, chatId])

        if (result[0] != undefined) {
            return true
        } else {
            return false
        }
    } catch (error) {
        throw error;
    }
}

// Returns chatid
const createPrivateChat = async (creatorID: number, targetID: number): Promise<number> => {
    try {
        const [result] = await pool.promise().query("INSERT INTO chats (type, creator) VALUES ('direct', ?) RETURNING ID", [creatorID])
        // attach users to chat
        const chatID = result[0].ID
        await pool.promise().query("INSERT INTO `user-chats` (chatId, userId) VALUES (?,?),(?,?)", [chatID, creatorID, chatID, targetID]);
        return chatID;
    } catch (error) {
        throw error;
    }
}

const getChatType = async (chatID: number): Promise<"direct" | "group"> => {
    try {
        const [result] = await pool.promise().query<RowDataPacket[]>("SELECT type FROM chats WHERE ID = ?", [chatID]);
        if (result.length == 0) {
            throw "Not found"
        }

        return result[0].type
    } catch (error) {
        throw error;
    }
}

const getChatName = async (chatID: number): Promise<string | null> => {
    try {
        const [result] = await pool.promise().query<RowDataPacket[]>("SELECT name FROM chats WHERE ID = ?", [chatID]);
        if (result.length == 0) {
            throw "Not found"
        }

        return result[0].name
    } catch (error) {
        throw error;
    }
}


const checkChatConflict = async (creatorID: number, targetID: number): Promise<boolean> => {
    try {
        const [result] = await pool.promise().query<RowDataPacket[]>(
            `SELECT ch.ID
             FROM chats ch
             JOIN \`user-chats\` uc ON uc.chatId = ch.ID
             WHERE (uc.userId = ? OR uc.userId = ?)
               AND ch.type = 'direct'
             GROUP BY ch.ID
             HAVING COUNT(DISTINCT uc.userId) = 2`,
            [creatorID, targetID])

        return result.length > 0;
    } catch (error) {
        throw error;
    }
};

// only used for group chats
const checkCreator = async (userID: number, chatID: number) => {
    const [result] = await pool.promise().query<RowDataPacket[]>("SELECT creator FROM chats WHERE ID = ?", [chatID])

    if (result.length == 0) {
        return false;
    }

    if (result[0].creator == userID) {
        return true;
    } else {
        return false;
    }
}

export { getParticipants, checkUserInChat, createPrivateChat, checkChatConflict, getChatType, getChatName, checkCreator };