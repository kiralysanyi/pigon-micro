import { RowDataPacket } from "mysql2";
import { hashPass, verifyPass } from "../password";
import { exists, pool } from "./db";
import { userdata } from "../../types/userdata";
import { randomUUID } from "node:crypto";
import md5 from "../md5";
import { createSession } from "./session";

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

const loginUser = (username: string, password: string): Promise<{token: string, refreshToken: string}> => {
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
                    const refreshTokenHash = md5(token);

                    console.log(tokenHash);
                    // save token hash

                    createSession(userData.ID, tokenHash, refreshTokenHash)

                    resolve({
                        token: token,
                        refreshToken: refreshToken
                    });
                } else {
                    return reject("Wrong password")
                }
            })
        })
    })
}

export { createUser, loginUser };