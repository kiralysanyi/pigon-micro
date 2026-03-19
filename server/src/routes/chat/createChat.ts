import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { validationResult } from "express-validator";
import { checkChatConflict, createPrivateChat } from "../../utils/db/chat";

const createChat: RequestHandler = async (req: reqWithUserinfo, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            success: false,
            validation: result.mapped()
        })
    }

    const { targetID } = req.body;

    // TODO: do not allow duplicate chats (only private chats ofc)
    if (await checkChatConflict(req.userinfo.ID, targetID)) {
        return res.status(409).json({
            message: "Chat already exists"
        })
    }

    createPrivateChat(req.userinfo.ID, parseInt(targetID)).then((chatID) => {
        return res.status(201).json({
            success: true,
            message: "Chat created with id: " + chatID
        })
    }).catch((err) => {
        console.error("Failed to create private chat: ", err)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    })
}

export default createChat;