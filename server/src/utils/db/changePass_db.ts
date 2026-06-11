import { RowDataPacket } from "mysql2";
import { hashPass, verifyPass } from "../password";
import { pool } from "./db"

const changePass_db = async (userId: number, old_password: string, new_password: string) => {
    // verify old password
    const oldPassHash = (await pool.query<RowDataPacket[]>("SELECT password FROM users WHERE ID = ?", [userId]))[0][0].password;
    const verified = await verifyPass(old_password, oldPassHash);
    if (!verified) {
        throw "Invalid credentials"
    }

    // check new password
    if (new_password.length < 8) {
        throw "Password has to be at least 8 characters long"
    }

    // save new password
    const newPassHash = await hashPass(new_password)

    await pool.query("UPDATE users SET password = ? WHERE ID = ?", [newPassHash, userId]);

    // log out every device

    await pool.query("DELETE FROM session WHERE userID = ?", [userId])

    return;
}

export default changePass_db;