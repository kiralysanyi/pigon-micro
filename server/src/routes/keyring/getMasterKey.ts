import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { pool } from "../../utils/db/db";
import { RowDataPacket } from "mysql2";

const getMasterKey: RequestHandler = (req: reqWithUserinfo, res) => {
    pool.query<RowDataPacket[]>("SELECT masterKey FROM users WHERE ID = ?", [req.userinfo.ID], (err, result) => {
        if (err) {
            console.error("Failed to get masterKey: ", err)
            return res.status(500).json({
                message: "Internal server error"
            })
        }

        if (result[0].masterKey == null) {
            return res.status(404).json({
                message: "No masterkey found for this user"
            })
        }

        return res.json({
            masterKey: result[0].masterKey
        })
    })
}

export default getMasterKey;