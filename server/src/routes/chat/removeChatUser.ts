import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { validationResult } from "express-validator";
import { checkCreator, checkUserInChat, getChatType } from "../../utils/db/chat";
import { pool } from "../../utils/db/db";
import { getSocketIOServer } from "../../socketio";

const removeChatUser: RequestHandler = async (req: reqWithUserinfo, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            success: false,
            validation: result.mapped()
        })
    }

    const chatID = parseInt(req.params.chatID as string);
    const userToRemove = parseInt(req.params.userId as string);

    // verify if operating user is in chat
    if (!await checkUserInChat(req.userinfo.ID, chatID)) {
        return res.status(403).json({
            message: "You do not have permission to add a user to this chat"
        })
    }

    // verify chat type
    if (await getChatType(chatID) == "direct") {
        return res.status(400).json({
            message: "You cannot remove users from a private chat"
        })
    }

    // verify if owner a.k.a creator

    if (!await checkCreator(req.userinfo.ID, chatID)) {
        // requester is not the creator
        return res.status(403).json({
            message: "You do not have permission for this operation"
        })
    } else {
        // requester is the creator
        // do not allow the removal of the creator
        if (req.userinfo.ID == userToRemove) {
            return res.status(403).json({
                message: "You do not have permission for this operation"
            })
        }
    }


    try {
        await pool.query("DELETE FROM `user-chats` WHERE userId = ? AND chatId = ?", [userToRemove, chatID]);

        try {
            const io = getSocketIOServer();
            io.to("usr" + userToRemove).emit("newchat")
        } catch (error) {
            console.log("Failed to notify user about new chat")
        }

        res.json({
            message: "Successfully deleted user from chat"
        })
    } catch (err) {
        console.error("Userremove error: ", err)
        return res.status(500).json({
            message: "Internal server error"
        })
    }

}

export default removeChatUser;