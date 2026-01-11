import { pool } from "./db"

const createSession = (userID: number, tokenHash: string, refreshTokenHash: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        pool.query("INSERT INTO session (userID, tokenHash, refreshTokenHash) VALUES (?,?,?)", [userID, tokenHash, refreshTokenHash], (err) => {
            if (err) {
                console.error("SQL error: ", err)
                return reject(err)
            }

            resolve(true);
        })
    })
}

export { createSession }