import { randomUUID } from "node:crypto"
import md5 from "../md5"
import { exists, pool } from "./db"
import { RowDataPacket } from "mysql2"
import serverConfig from "../../config"
import { userdata } from "../../types/userdata"

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

const getNewToken = (refreshToken: string): Promise<{ token: string, tokenExpire: Date }> => {
    return new Promise(async (resolve, reject) => {
        const hashed = md5(refreshToken);
        const newToken = randomUUID();
        const newTokenHash = md5(newToken)

        const recordExists = await exists("session", "refreshTokenHash", hashed);
        if (!recordExists) {
            return reject("Invalid token")
        }

        // handle token expiration

        pool.query<RowDataPacket[]>("SELECT refreshTokenExpire FROM session WHERE refreshTokenHash = ?", [hashed], (err, result) => {
            if (err) {
                console.error("SQL error: ", err)
                return reject(err);
            }

            const expireDate = new Date(result[0]["refreshTokenExpire"]);

            if (expireDate < new Date()) {
                console.log("Refresh token expired")
                return reject("Refresh token expired")

            }

            const newExpireDate = new Date();
            newExpireDate.setMinutes(newExpireDate.getMinutes() + serverConfig.ACCESS_EXPIRE)


            pool.query("UPDATE session SET tokenHash = ?, tokenExpire = ? WHERE refreshTokenHash = ?", [newTokenHash, newExpireDate, hashed], (err) => {
                if (err) {
                    console.error("SQL error: ", err)
                    return reject(err);
                }

                resolve({ token: newToken, tokenExpire: newExpireDate })
            })
        })
    })
}

const getNewRefreshToken = (refreshToken: string): Promise<{ refreshToken: string, refreshTokenExpire: Date }> => {
    return new Promise(async (resolve, reject) => {
        const hashed = md5(refreshToken);
        const newToken = randomUUID();
        const newTokenHash = md5(newToken);

        const recordExists = await exists("session", "refreshTokenHash", hashed);
        if (!recordExists) {
            return reject("Invalid token")
        }

        // handle token expiration

        pool.query<RowDataPacket[]>("SELECT refreshTokenExpire FROM session WHERE refreshTokenHash = ?", [hashed], (err, result) => {
            if (err) {
                console.error("SQL error: ", err)
                return reject(err);
            }

            const expireDate = new Date(result[0]["refreshTokenExpire"]);

            if (expireDate < new Date()) {
                console.log("Refresh token expired")
                return reject("Refresh token expired")
            }

            const newExpireDate = new Date();
            newExpireDate.setHours(newExpireDate.getHours() + serverConfig.REFRESH_EXPIRE)

            pool.query("UPDATE session SET refreshTokenHash = ?, refreshTokenExpire= ? WHERE refreshTokenHash = ?", [newTokenHash, newExpireDate, hashed], (err) => {
                if (err) {
                    console.error("SQL error: ", err)
                    return reject(err);
                }

                resolve({ refreshToken: newToken, refreshTokenExpire: newExpireDate })
            })
        })
    })
}

const verifyAccessToken = (token: string): Promise<userdata> => {
    return new Promise((resolve, reject) => {
        const hashed = md5(token);

        pool.query<RowDataPacket[]>("SELECT userID, tokenExpire FROM session WHERE tokenHash = ?", [hashed], (err, result) => {
            if (err) {
                console.error("SQL error: ", err)
                return reject(err);
            }

            if (result.length == 0) {
                return reject("Invalid token")
            }

            const expireDate = new Date(result[0]["tokenExpire"]);

            if (expireDate < new Date()) {
                return reject("Token expired");
            }

            pool.query<RowDataPacket[]>("SELECT ID, username, pubKey, created_at, updated_at FROM users WHERE ID = ?", [result[0]["userID"]], (err, result) => {
                if (err) {
                    console.error("SQL error: ", err)
                    return reject(err);
                }

                if (result.length == 0) {
                    return reject("No user assigned to this session")
                }

                const data: userdata = result[0] as userdata;

                return resolve(data);
            })
        })
    })
}

export { createSession, getNewToken, getNewRefreshToken, verifyAccessToken }