import { RequestHandler } from "express";
import { pool } from "../../utils/db/db";
import sha256 from "../../utils/sha256";

const logout: RequestHandler = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1] as string;

    const hashed = sha256(token);

    try {
        await pool.promise().query("DELETE FROM session WHERE tokenHash = ? ", [hashed]);
        return res.json({
            message: "Logout was successfull"
        })
    } catch (error) {
        return res.status(500).json({
            message: "Failed to log out"
        })
    }
}

export default logout;