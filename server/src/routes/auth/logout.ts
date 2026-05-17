import { RequestHandler } from "express";
import { pool } from "../../utils/db/db";
import sha256 from "../../utils/sha256";

const logout: RequestHandler = (req, res) => {
    const token = req.headers.authorization.split(' ')[1] as string;

    const hashed = sha256(token);

    pool.query("DELETE FROM session WHERE tokenHash = ? ", [hashed], (err) => {
        if (err) {
            console.error("Logout failed: ", err)
            return res.status(500).json({
                message: "Failed to log out"
            })
        }

        return res.json({
            message: "Logout was successfull"
        })
    })
}

export default logout;