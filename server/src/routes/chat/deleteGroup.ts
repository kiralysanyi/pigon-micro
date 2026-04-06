import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { checkCreator, getChatType, getParticipants } from "../../utils/db/chat";
import { pool } from "../../utils/db/db";
import { getSocketIOServer } from "../../socketio";

const deleteGroup: RequestHandler = async (req: reqWithUserinfo, res) => {
    const chatId = parseInt(req.params.id as string);

    if (isNaN(chatId)) {
        return res.status(400).json({
            message: "Invalid chatid: " + req.params.id
        })
    }

    if (!await checkCreator(req.userinfo.ID, chatId)) {
        return res.status(403).json({
            message: "You do not have permission for this operation"
        })
    }

    if (await getChatType(chatId) != "group") {
        return res.status(400).json({
            message: "You can only delete groups"
        })
    }

    try {
        const participants = await getParticipants(chatId)
        await pool.promise().query("DELETE FROM chats WHERE ID = ?", [chatId]);
        const io = getSocketIOServer();

        for (let i in participants) {
            io.to("usr" + participants[i].id).emit("newchat")
        }
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        })
    }

    return res.json({
        message: "Group deleted"
    })
}

export default deleteGroup;