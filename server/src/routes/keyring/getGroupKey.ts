import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { pool } from "../../utils/db/db";
import { RowDataPacket } from "mysql2";

const getGroupKey: RequestHandler = async (req: reqWithUserinfo, res) => {
    const chatID = parseInt(req.params.chatID as string);
    const kGuid = req.params.kGuid;
    console.log("GetKey: ", chatID, kGuid)

    if (kGuid == "0") {
        // get latest active key for the user
        try {
            const [result] = await pool.query<RowDataPacket[]>("SELECT * FROM group_keys WHERE userId = ? AND chatID = ? AND status = 'active'", [req.userinfo.ID, chatID])

            if (result.length == 0) {
                console.log("No keys: ", result)
                return res.status(404).json({
                    message: "No key found"
                })
            }

            return res.json({
                key: result[0]
            })
        } catch (err) {
            console.error(err)
            return res.status(500).json({
                message: "Internal server error"
            })
        }
    }

    try {
        const [result] = await pool.query<RowDataPacket[]>("SELECT * FROM group_keys WHERE userId = ? AND kGuid = ? AND chatId = ?", [req.userinfo.ID, kGuid, chatID])


        if (result.length == 0) {
            return res.status(404).json({
                message: "No key found"
            })
        }

        return res.json({
            key: result[0]
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({
            message: "Internal server error"
        })
    }

}

export default getGroupKey;