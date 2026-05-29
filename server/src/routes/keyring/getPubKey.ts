import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { pool } from "../../utils/db/db";
import { RowDataPacket } from "mysql2";

const getPubKey: RequestHandler = async (req: reqWithUserinfo, res) => {
    let targetID = req.userinfo.ID;
    if (req.query.userID != undefined) {
        targetID = parseInt((req.query.userID as string));
    }

    try {
        const [result] = await pool.promise().query<RowDataPacket[]>("SELECT pubKey FROM users WHERE ID = ?", [targetID]);

        if (result.length == 0) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            })
        }

        return res.json({
            success: true,
            data: {
                pubKey: result[0]["pubKey"]
            }
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        })
    }

}

export default getPubKey;