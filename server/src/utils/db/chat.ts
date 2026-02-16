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
                ;
                console.error("Failed to get participants: ", err)
                return rejected(err)
            }

            resolved(result)
        })
    })
}

export { getParticipants };