import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { mediaPath } from "../../utils/multer";
import { checkUserInChat } from "../../utils/db/chat";
import { pool } from "../../utils/db/db";
import {  RowDataPacket } from "mysql2";

const getFile: RequestHandler = async (req: reqWithUserinfo, res) => {
    const assetId = req.params.assetId;
    // TODO: verify access
    const [result] = await pool.promise().query<RowDataPacket[]>("SELECT * FROM chat_files WHERE uuid = ?", [assetId]);

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