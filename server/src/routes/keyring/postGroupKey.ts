import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { checkUserInChat } from "../../utils/db/chat";
import { pool } from "../../utils/db/db";
import { validationResult } from "express-validator";
import { randomUUID } from "node:crypto";

const postGroupKey: RequestHandler = async (req: reqWithUserinfo, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            success: false,
            validation: result.mapped()
        })
    }

    const chatID = parseInt(req.params.chatID as string);
    const targetUserId = req.body.targetUserId;
    const encryptedKey = req.body.encryptedKey;
    const kGuid = req.body.kGuid ? req.body.kGuid : randomUUID();

    if (!await checkUserInChat(req.userinfo.ID, chatID)) {
        return res.status(403).json({
            message: "You do not have permission to add keys to this chat"
        })
    }

    // retire old keys

    await pool.promise().query("UPDATE group_keys SET status = 'retired' WHERE chatId = ? AND status = 'active' AND userId = ?", [chatID, targetUserId]);

    // insert new key
    pool.query("INSERT INTO group_keys (kGuid, userId, creatorId, chatId, encryptedKey) VALUES (?,?,?,?,?)", [kGuid, targetUserId, req.userinfo.ID, chatID, encryptedKey], (err) => {
        if (err) {
            console.error(err)
            return res.status(500).json({
                message: "Internal server error"
            })
        }

        return res.status(201).json({
            message: "Key added successfully"
        })
    })
}

export default postGroupKey;