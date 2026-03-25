import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { checkUserInChat, getChatType } from "../../utils/db/chat";
import { pool } from "../../utils/db/db";
import { getSocketIOServer } from "../../socketio";

const addChatUser: RequestHandler = async (req: reqWithUserinfo, res) => {
    const chatID = parseInt(req.params.chatID as string);
    const userToAdd = parseInt(req.params.userId as string);

    // verify if operating user is in chat
    if (!await checkUserInChat(req.userinfo.ID, chatID)) {
        return res.status(403).json({
            message: "You do not have permission to add a user to this chat"
        })
    }

    // verify chat type
    if (await getChatType(chatID) == "direct") {
        return res.status(400).json({
            message: "You cannot add users to a private chat"
        })
    }

    // verify no conflict

    if (await checkUserInChat(userToAdd, chatID)) {
        return res.status(409).json({
            message: "User already in chat"
        })
    }

    pool.query("INSERT INTO `user-chats` (chatId, userId) VALUES (?,?)", [chatID, userToAdd], (err) => {
        if (err) {
            console.error("Useradd error: ", err)
            return res.status(500).json({
                message: "Internal server error"
            })
        }

        try {
            const io = getSocketIOServer();
            io.to("usr" + userToAdd).emit("newchat")
        } catch (error) {
            console.log("Failed to notify user about new chat")
        }

        res.status(201).json({
            message: "User added, please add a key for this user too."
        })
    })
}

export default addChatUser;