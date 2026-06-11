import { RowDataPacket } from "mysql2";
import { hashPass, verifyPass } from "../password";
import { exists, pool } from "./db";
import { userdata } from "../../types/userdata";
import { randomUUID } from "node:crypto";
import { createSession } from "./session";
import { userdataBrief } from "../../types/userdataBrief";
import sha256 from "../sha256";

const createUser = async (username: string, password: string): Promise<boolean> => {
    const userExists = await exists("users", "username", username);

    if (userExists) {
        return false;
    }

    try {
        const passwordHash = await hashPass(password);
        await pool.query("INSERT INTO users (username, password) VALUES (?,?)", [username, passwordHash])
        return true;
    } catch (error) {
        throw error;
    }
}

const loginUser = async (username: string, password: string): Promise<{ token: string, refreshToken: string, tokenExpire: Date, refreshTokenExpire: Date }> => {
    try {
        const [result] = await pool.query<RowDataPacket[]>("SELECT * FROM users WHERE username = ?", [username])

        if (result.length == 0) {
            console.log("User does not exist: ", username);
            throw ("User does not exist");
        }

        const userData: userdata = result[0] as userdata;


        const success = await verifyPass(password, userData.password)
        if (success == true) {
            const token = randomUUID();
            const tokenHash = sha256(token);
            const refreshToken = randomUUID();
            const refreshTokenHash = sha256(refreshToken);

            console.log(tokenHash);
            // save token hash

            const tokenExpire = new Date();
            const refreshTokenExpire = new Date();

            tokenExpire.setMinutes(tokenExpire.getMinutes() + 5);
            refreshTokenExpire.setHours(refreshTokenExpire.getHours() + 128);

            await createSession(userData.ID, tokenHash, refreshTokenHash, tokenExpire, refreshTokenExpire)

            return {
                token: token,
                refreshToken: refreshToken,
                tokenExpire: tokenExpire,
                refreshTokenExpire: refreshTokenExpire
            };
        } else {
            throw ("Wrong password")
        }
    } catch (error) {
        throw error;
    }

}

const listUsers = async (search: string, limit: number = 50): Promise<userdataBrief[]> => {
    try {
        const [result] = await pool.query<RowDataPacket[]>("SELECT id, username, created_at FROM users WHERE username LIKE ? LIMIT ?", [`%${search}%`, limit])
        return result as userdataBrief[];
    } catch (error) {
        throw error;
    }
}

// get user info
const getUser = async (userID: number): Promise<userdata | false> => {
    try {
        const [result] = await pool.query<RowDataPacket[]>("SELECT ID, username, created_at, updated_at, pubKey FROM users WHERE ID = ?", [userID])

        if (result.length == 0) {
            return false;
        }

        return result[0] as userdata
    } catch (error) {
        throw error;
    }
}

export { createUser, loginUser, listUsers, getUser };