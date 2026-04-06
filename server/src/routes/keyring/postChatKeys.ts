import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { validationResult } from "express-validator";
import { pool } from "../../utils/db/db";

const postChatKeys: RequestHandler = async (req: reqWithUserinfo, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            success: false,
            validation: result.mapped()
        })
    }

    const userID = req.userinfo.ID;
    const { pubKey, encryptedPrivKey } = req.body;


    await pool.promise().query("UPDATE chat_keys SET status = 'retired' WHERE status = 'active' AND userID = ?", [userID])

    pool.query("INSERT INTO chat_keys (userID, pubKey, encryptedPrivKey, status) VALUES (?,?,?, 'active')", [userID, pubKey, encryptedPrivKey], (err) => {
        if (err) {
            console.error("Failed to add chatkeys for user: " + userID, err)
            return res.status(500).json({
                message: "Internal server error"
            })
        }

        return res.status(201).json({
            message: "New key added"
        })
    })

}

export default postChatKeys