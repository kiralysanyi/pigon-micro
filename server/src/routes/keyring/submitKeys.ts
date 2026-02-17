import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { validationResult } from "express-validator";
import { checkUserInChat, getParticipants } from "../../utils/db/chat";
import { addChatKey } from "../../utils/db/keyring";

const submitKeys: RequestHandler = async (req: reqWithUserinfo, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            success: false,
            validation: result.mapped()
        })
    }

    const { chatID, key, type } = req.body;

    switch (type) {
        case "chat":
            // check if user in chat

            try {
                const inChat = await checkUserInChat(req.userinfo.ID, chatID);
                if (inChat != true) {
                    return res.status(403).json({
                        success: false,
                        message: "You are not allowed to add keys to this chat"
                    })
                }
            } catch (error) {
                console.error(error);
                return res.status(500).json({
                    success: false,
                    message: "Failed to verify permissions"
                })
            }

            getParticipants(chatID).then(async (participants) => {
                for (let i in participants) {
                    await addChatKey(participants[i].ID, chatID, key)
                }

                console.log("Added key to chat: ", chatID)

                return res.status(201).json({
                    success: true
                })
            })
            break;

        default:
            return res.status(400).json({
                success: false,
                message: "Unknown type: " + type
            })
            break;
    }


}

export default submitKeys;