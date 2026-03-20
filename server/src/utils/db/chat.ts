import { QueryResult, RowDataPacket } from "mysql2";
import { pool } from "./db";

const getParticipants = (chatID: number): Promise<RowDataPacket[]> => {
    return new Promise((resolved, rejected) => {
        const sql = `SELECT users.ID AS id, users.username AS username, users.pubKey AS pubKey
        FROM \`user-chats\` 
        LEFT JOIN users ON \`user-chats\`.userId = users.ID 
        WHERE \`user-chats\`.chatId = ?;`;
        pool.query<RowDataPacket[]>(sql, [chatID], (err, result) => {
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

// Returns chatid
const createPrivateChat = (creatorID: number, targetID: number): Promise<number> => {
    return new Promise((resolve, reject) => {
        // create chat
        pool.query("INSERT INTO chats (type, creator) VALUES ('direct', ?) RETURNING ID", [creatorID], (err, result) => {
            if (err) {
                return reject(err)
            }

            // attach users to chat
            const chatID = result[0].ID

            pool.query("INSERT INTO `user-chats` (chatId, userId) VALUES (?,?),(?,?)", [chatID, creatorID, chatID, targetID], (err, result) => {
                if (err) {
                    return reject(err)
                }

                resolve(chatID)
            })
        })
    })

}

const getChatType = (chatID: number): Promise<"direct" | "group"> => {
    return new Promise((resolve, reject) => {
        pool.query<RowDataPacket[]>("SELECT type FROM chats WHERE ID = ?", [chatID], (err, result) => {
            if (err) {
                return reject(err)
            }

            if (result.length == 0) {
                return reject("not found")
            }

            resolve(result[0].type)
        })
    })
}


const checkChatConflict = (creatorID: number, targetID: number): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        pool.query<RowDataPacket[]>(
            `SELECT ch.ID
             FROM chats ch
             JOIN \`user-chats\` uc ON uc.chatId = ch.ID
             WHERE (uc.userId = ? OR uc.userId = ?)
               AND ch.type = 'direct'
             GROUP BY ch.ID
             HAVING COUNT(DISTINCT uc.userId) = 2`,
            [creatorID, targetID],
            (err, result) => {
                if (err) return reject(err);
                resolve(result.length > 0);
            }
        );
    });
};


export { getParticipants, checkUserInChat, createPrivateChat, checkChatConflict, getChatType };