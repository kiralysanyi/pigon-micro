import { pool } from "./db"

const createSession = (userID: number, tokenHash: string, refreshTokenHash: string, tokenExpire: Date, refreshTokenExpire: Date): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        pool.query("INSERT INTO session (userID, tokenHash, refreshTokenHash, tokenExpire, refreshTokenExpire) VALUES (?,?,?,?,?)", [userID, tokenHash, refreshTokenHash, tokenExpire, refreshTokenExpire], (err) => {
            if (err) {
                console.error("SQL error: ", err)
                return reject(err)
            }

            resolve(true);
        })
    })
}

const updateSession = ({ tokenID, tokenHash, tokenExpire, refreshTokenHash, refreshTokenExpire }: { tokenID: number, tokenHash?: string, tokenExpire?: Date, refreshTokenHash?: string, refreshTokenExpire?: Date }): Promise<Boolean> => {
    return new Promise((resolve, reject) => {
        // update token
        if (tokenHash && tokenExpire) {
            pool.query("UPDATE session SET tokenHash = ?, tokenExpire = ? WHERE id = ?", [tokenHash, tokenExpire, tokenID], (err) => {
                if (err) {
                    console.error("SQL error: ", err)
                    return reject(err)
                }

                return resolve(true);
            })
        }

        // update refresh token

        if (refreshTokenHash && refreshTokenExpire) {
            pool.query("UPDATE session SET refreshTokenHash = ?, refreshTokenExpire = ? WHERE id = ?", [refreshTokenHash, refreshTokenExpire, tokenID], (err) => {
                if (err) {
                    console.error("SQL error: ", err)
                    return reject(err)
                }

                return resolve(true);
            })
        }
    })
}

export { createSession, updateSession }