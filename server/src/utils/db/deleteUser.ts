import { RowDataPacket } from "mysql2";
import { pool } from "./db";
import { verifyPass } from "../password";

const deleteUser = async (userId: number, password: string) => {
    const [result] = await pool.query<RowDataPacket[]>("SELECT password FROM users WHERE ID = ?", [userId]);
    if (result.length == 0) {
        throw "User not found";
    }
    const passHash = result[0].password;
    const verified = await verifyPass(password, passHash);
    if (!verified) {
        throw "Invalid credentials";
    }

    await pool.query("DELETE FROM users WHERE ID = ?", [userId]);
    return;
}

export default deleteUser;