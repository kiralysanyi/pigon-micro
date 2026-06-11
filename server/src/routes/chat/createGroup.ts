import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { pool } from "../../utils/db/db";
import { validationResult } from "express-validator";

// create the group, and then add the creator to the group. key creation/submission should be handled client side.
const createGroup: RequestHandler = async (req: reqWithUserinfo, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            success: false,
            validation: result.mapped()
        })
    }

    const creatorID = req.userinfo.ID;
    try {
        const [result] = await pool.query("INSERT INTO chats (type, creator, name) VALUES ('group', ?, ?) RETURNING ID", [creatorID, req.body.chatName])
        const chatID = result[0].ID
        await pool.query("INSERT INTO `user-chats` (chatId, userId) VALUES (?,?)", [chatID, creatorID]);

        return res.status(201).json({
            success: true,
            message: "Group created with id: " + chatID,
            chatID
        })
    } catch (error) {
        console.error("Group create: ", error)
        return res.status(500).json({
            message: "Internal server error"
        })
    }


}

export default createGroup;