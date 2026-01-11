import { randomUUID } from "node:crypto"
import md5 from "../md5"
import { exists, pool } from "./db"

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

const getNewToken = (refreshToken: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        const hashed = md5(refreshToken);
        const newToken = randomUUID();
        const newTokenHash = md5(newToken)

        // TODO: add expired token handling
        const recordExists = await exists("session", "refreshTokenHash", hashed);
        if (!recordExists) {
            return reject("Session does not exist")
        }

        pool.query("UPDATE session SET tokenHash = ? WHERE refreshTokenHash = ?", [newTokenHash, hashed], (err) => {
            if (err) {
                console.error("SQL error: ", err)
                return reject(err);
            }

            resolve(newToken)
        })
    })
}

const getNewRefreshToken = (refreshToken: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        const hashed = md5(refreshToken);
        const newToken = randomUUID();
        const newTokenHash = md5(newToken)

        // TODO: add expired token handling
        const recordExists = await exists("session", "refreshTokenHash", hashed);
        if (!recordExists) {
            return reject("Session does not exist")
        }

        pool.query("UPDATE session SET refreshTokenHash = ? WHERE refreshTokenHash = ?", [newTokenHash, hashed], (err) => {
            if (err) {
                console.error("SQL error: ", err)
                return reject(err);
            }

            resolve(newToken)
        })
    })
}

export { createSession, getNewToken, getNewRefreshToken }