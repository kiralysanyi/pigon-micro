import { pool } from "./db"
import { keyringdata } from "../../types/keyringdata";

const getUserKeys = (userId: number): Promise<keyringdata[]> => {
    return new Promise((resolved, rejected) => {
        const sql = `
                SELECT 
                    keyring.ID, 
                    keyring.userID, 
                    keyring.type, 
                    keyring.value, 
                    \`keyring-chat\`.chatId AS chatID 
                FROM keyring 
                LEFT JOIN \`keyring-chat\` ON keyring.userID = \`keyring-chat\`.userId 
                WHERE keyring.userID = ? AND keyring.type = "chat"`;
        pool.query(sql, [userId], (err, result) => {
            if (err) {
                console.error(err);
                rejected(err);
                return;
            }

            resolved(result as keyringdata[])
        })
    })
}

const addChatKey = (userId: number, chatID: number, key: string): Promise<void> => {
    return new Promise((resolved, rejected) => {
        // add key for user
        let sql = `INSERT INTO keyring (userID, type, value) VALUES (?, 'chat', ?) RETURNING ID`;
        pool.query(sql, [userId, key], (err, result) => {
            if (err) {
                console.error(err);
                rejected(err);
                return;
            }

            const keyID = result[0].ID;

            // connect keyring to chat
            sql = `INSERT INTO \`keyring-chat\` (chatId, keyId, userId) VALUES (?,?,?)`
            pool.query(sql, [chatID, keyID, userId], (err, result) => {
                if (err) {
                    console.error(err);
                    rejected(err);
                    return;
                }

                resolved();
            })
        })
    });
}


export { getUserKeys, addChatKey }