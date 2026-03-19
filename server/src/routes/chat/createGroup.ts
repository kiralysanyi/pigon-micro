import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { pool } from "../../utils/db/db";

// create the group, and then add the creator to the group. key creation/submission should be handled client side.
const createGroup: RequestHandler = (req: reqWithUserinfo, res) => {
    const creatorID = req.userinfo.ID;
    pool.query("INSERT INTO chats (type, creator) VALUES ('group', ?) RETURNING ID", [creatorID], (err, result) => {
        if (err) {
            console.error("Group create: ", err)
            return res.status(500).json({
                message: "Internal server error"
            })
        }

        // attach creator to chat
        const chatID = result[0].ID

        pool.query("INSERT INTO `user-chats` (chatId, userId) VALUES (?,?)", [chatID, creatorID], (err, result) => {
            if (err) {
                console.error("Group create: ", err)
                return res.status(500).json({
                    message: "Internal server error"
                })
            }

            return res.status(201).json({
                success: true,
                message: "Group created with id: " + chatID,
                chatID
            })
        })
    })
}

export default createGroup;