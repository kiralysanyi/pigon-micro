import { hashPass } from "../password";
import { exists, pool } from "./db";

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

export { createUser };