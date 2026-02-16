import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { validationResult } from "express-validator";
import { getParticipants } from "../../utils/db/chat";
import { addChatKey } from "../../utils/db/keyring";

const submitKeys: RequestHandler = (req: reqWithUserinfo, res) => {
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