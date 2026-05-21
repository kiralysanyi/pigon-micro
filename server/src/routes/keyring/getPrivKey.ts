import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { pool } from "../../utils/db/db";
import { RowDataPacket } from "mysql2";

const getPrivKey: RequestHandler = async (req: reqWithUserinfo, res) => {
    try {
        const [result] = await pool.promise().query<RowDataPacket[]>("SELECT encryptedPrivKey FROM users WHERE ID = ?", [req.userinfo.ID]);

        if (result.length == 0) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            })
        }

        return res.json({
            success: true,
            data: {
                encryptedPrivKey: result[0]["encryptedPrivKey"]
            }
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({
            success: false,
            error: "SQL error"
        })
    }

}

export default getPrivKey