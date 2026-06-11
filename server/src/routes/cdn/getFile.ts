import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { mediaPath } from "../../utils/multer";
import { checkUserInChat } from "../../utils/db/chat";
import { pool } from "../../utils/db/db";
import {  RowDataPacket } from "mysql2";

const getFile: RequestHandler = async (req: reqWithUserinfo, res) => {
    const assetId = req.params.assetId;
    const [result] = await pool.query<RowDataPacket[]>("SELECT * FROM chat_files WHERE uuid = ?", [assetId]);

    if (result.length == 0) {
        return res.status(404).json({
            message: "Asset not found"
        })
    }

    const chatId = result[0].chatId

    console.log(req.userinfo.ID, chatId)
    if (!await checkUserInChat(req.userinfo.ID, chatId)) {
        return res.status(403).json({
            message: "You are not allowed to retrieve files of this chat"
        })
    }

    res.sendFile(`${mediaPath}/${assetId}`)
}

export default getFile;