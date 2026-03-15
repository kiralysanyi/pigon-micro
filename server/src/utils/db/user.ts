import { RowDataPacket } from "mysql2";
import { hashPass, verifyPass } from "../password";
import { exists, pool } from "./db";
import { userdata } from "../../types/userdata";
import { randomUUID } from "node:crypto";
import md5 from "../md5";
import { createSession } from "./session";
import { userdataBrief } from "../../types/userdataBrief";

const createUser = (username: string, password: string): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        const userExists = await exists("users", "username", username);

        if (userExists) {
            return resolve(false)
        }


        const passwordHash = await hashPass(password);

        pool.query("INSERT INTO users (username, password) VALUES (?,?)", [username, passwordHash], (err) => {
            if (err) {
                console.error("SQL error: ", err)
                return reject(err);
            }

            resolve(true);
        })
    })
}

const loginUser = (username: string, password: string): Promise<{ token: string, refreshToken: string, tokenExpire: Date, refreshTokenExpire: Date }> => {
    return new Promise((resolve, reject) => {
        pool.query<RowDataPacket[]>("SELECT * FROM users WHERE username = ?", [username], (err, result) => {
            if (err) {
                console.error("SQL error: ", err);
                return reject(err);
            }

            if (result.length == 0) {
                console.log("User does not exist: ", username);
                return reject("User does not exist");
            }

            const userData: userdata = result[0] as userdata;


            verifyPass(password, userData.password).then((success) => {
                if (success == true) {
                    const token = randomUUID();
                    const tokenHash = md5(token);
                    const refreshToken = randomUUID();
                    const refreshTokenHash = md5(refreshToken);

                    console.log(tokenHash);
                    // save token hash

                    const tokenExpire = new Date();
                    const refreshTokenExpire = new Date();

                    tokenExpire.setMinutes(tokenExpire.getMinutes() + 5);
                    refreshTokenExpire.setHours(refreshTokenExpire.getHours() + 128);

                    createSession(userData.ID, tokenHash, refreshTokenHash, tokenExpire, refreshTokenExpire)

                    resolve({
                        token: token,
                        refreshToken: refreshToken,
                        tokenExpire: tokenExpire,
                        refreshTokenExpire: refreshTokenExpire
                    });
                } else {
                    return reject("Wrong password")
                }
            })
        })
    })
}

const listUsers = (search: string, limit: number = 50): Promise<userdataBrief[]> => {
    return new Promise((resolve, reject) => {
        pool.query<RowDataPacket[]>("SELECT id, username, created_at FROM users WHERE username LIKE ? LIMIT ?", [`%${search}%`, limit], (err, result) => {
            if (err) {
                console.error("Failed to list users: ", err)
                return reject(err)
            }

            resolve(result as userdataBrief[])
        })
    })
}

// get user info
const getUser = (userID: number): Promise<userdata | false> => {
    return new Promise((resolve, reject) => {
        pool.query<RowDataPacket[]>("SELECT ID, username, created_at, updated_at, pubKey FROM users WHERE ID = ?", [userID], (err, result) => {
            if (err) {
                console.error("Failed to get user info: ", err)
                return reject(err);
            }

            if (result.length == 0) {
                return resolve(false)
            }

            resolve(result[0] as userdata)
        })
    })
}

export { createUser, loginUser, listUsers, getUser };