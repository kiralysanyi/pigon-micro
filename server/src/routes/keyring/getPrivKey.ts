import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { pool } from "../../utils/db/db";
import { RowDataPacket } from "mysql2";

const getPrivKey: RequestHandler = (req: reqWithUserinfo, res) => {
    pool.query<RowDataPacket[]>("SELECT encryptedPrivKey FROM users WHERE ID = ?", [req.userinfo.ID], (err, result) => {
        if (err) {
            console.error(err)
            return res.status(500).json({
                success: false,
                error: "SQL error"
            })
        }

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
    })
}

export default getPrivKey