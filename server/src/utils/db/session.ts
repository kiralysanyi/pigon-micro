import { randomUUID } from "node:crypto"
import { exists, pool } from "./db"
import { RowDataPacket } from "mysql2"
import serverConfig from "../../config"
import { userdata } from "../../types/userdata"
import sha256 from "../sha256"

const createSession = async (userID: number, tokenHash: string, refreshTokenHash: string, tokenExpire: Date, refreshTokenExpire: Date): Promise<boolean> => {
    try {
        await pool.query("INSERT INTO session (userID, tokenHash, refreshTokenHash, tokenExpire, refreshTokenExpire) VALUES (?,?,?,?,?)", [userID, tokenHash, refreshTokenHash, tokenExpire, refreshTokenExpire]);
        return true;
    } catch (error) {
        throw error;
    }
}

const getNewToken = async (refreshToken: string): Promise<{ token: string, tokenExpire: Date }> => {
    const hashed = sha256(refreshToken);
    const newToken = randomUUID();
    const newTokenHash = sha256(newToken);

    const recordExists = await exists("session", "refreshTokenHash", hashed);
    if (!recordExists) {
        throw ("Invalid token")
    }

    // handle token expiration
    try {
        const [result] = await pool.query<RowDataPacket[]>("SELECT refreshTokenExpire FROM session WHERE refreshTokenHash = ?", [hashed]);

        const expireDate = new Date(result[0]["refreshTokenExpire"]);

        if (expireDate < new Date()) {
            console.log("Refresh token expired")
            throw ("Refresh token expired")

        }

        const newExpireDate = new Date();
        newExpireDate.setMinutes(newExpireDate.getMinutes() + serverConfig.ACCESS_EXPIRE);

        await pool.query("UPDATE session SET tokenHash = ?, tokenExpire = ? WHERE refreshTokenHash = ?", [newTokenHash, newExpireDate, hashed]);
        return { token: newToken, tokenExpire: newExpireDate };
    } catch (err) {
        throw err;
    }
}

const getNewRefreshToken = async (refreshToken: string): Promise<{ refreshToken: string, refreshTokenExpire: Date }> => {
    const hashed = sha256(refreshToken);
    const newToken = randomUUID();
    const newTokenHash = sha256(newToken);

    const recordExists = await exists("session", "refreshTokenHash", hashed);
    if (!recordExists) {
        throw ("Invalid token")
    }

    // handle token expiration

    try {
        const [result] = await pool.query<RowDataPacket[]>("SELECT refreshTokenExpire FROM session WHERE refreshTokenHash = ?", [hashed]);
        const expireDate = new Date(result[0]["refreshTokenExpire"]);

        if (expireDate < new Date()) {
            console.log("Refresh token expired")
            throw ("Refresh token expired")
        }

        const newExpireDate = new Date();
        newExpireDate.setHours(newExpireDate.getHours() + serverConfig.REFRESH_EXPIRE);

        await pool.query("UPDATE session SET refreshTokenHash = ?, refreshTokenExpire= ? WHERE refreshTokenHash = ?", [newTokenHash, newExpireDate, hashed])
        return { refreshToken: newToken, refreshTokenExpire: newExpireDate }
    } catch (error) {
        throw error;
    }
}

const verifyAccessToken = async (token: string): Promise<userdata> => {
    const hashed = sha256(token);

    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT u.ID, u.username, u.pubKey, u.created_at, u.updated_at, s.tokenExpire
         FROM session s
         JOIN users u ON u.ID = s.userID
         WHERE s.tokenHash = ?
           AND s.tokenExpire > NOW()`,
        [hashed]
    );

    if (rows.length === 0) {
        throw new Error("Invalid or expired token");
    }

    return rows[0] as userdata;
};

export { createSession, getNewToken, getNewRefreshToken, verifyAccessToken }