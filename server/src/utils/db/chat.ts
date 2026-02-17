import { QueryResult } from "mysql2";
import { pool } from "./db";

const getParticipants = (chatID: number): Promise<QueryResult> => {
    return new Promise((resolved, rejected) => {
        const sql = `SELECT users.ID, users.username, users.pubKey
        FROM \`user-chats\` 
        LEFT JOIN users ON \`user-chats\`.userId = users.ID 
        WHERE \`user-chats\`.chatId = ?;`;
        pool.query(sql, [chatID], (err, result) => {
            if (err) {
                console.error("Failed to get participants: ", err)
                return rejected(err)
            }

            resolved(result)
        })
    })
}


const checkUserInChat = (userId: number, chatId: number): Promise<boolean> => {
    return new Promise((resolved, rejected) => {
        const sql = `SELECT 1 FROM \`user-chats\` WHERE userId = ? AND chatId = ?`
        pool.query(sql, [userId, chatId], (err, result) => {
            if (err) {
                console.error("Failed to check user in chat: ", err)
                return rejected(err)
            }

            if (result[0] != undefined) {
                resolved(true)
            } else {
                resolved(false)
            }
        })
    });
}

export { getParticipants, checkUserInChat };