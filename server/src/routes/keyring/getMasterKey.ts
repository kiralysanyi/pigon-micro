import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { pool } from "../../utils/db/db";
import { RowDataPacket } from "mysql2";

const getMasterKey: RequestHandler = async (req: reqWithUserinfo, res) => {
    try {
        const [result] = await pool.query<RowDataPacket[]>("SELECT masterKey FROM users WHERE ID = ?", [req.userinfo.ID])
        if (result[0].masterKey == null) {
            return res.status(404).json({
                message: "No masterkey found for this user"
            })
        }

        return res.json({
            masterKey: result[0].masterKey
        })
    } catch (err) {
        console.error("Failed to get masterKey: ", err)
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}

export default getMasterKey;