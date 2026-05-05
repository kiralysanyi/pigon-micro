import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { mediaUpload } from "../../utils/multer";
import { pool } from "../../utils/db/db";
import { checkUserInChat } from "../../utils/db/chat";
const upload = mediaUpload.single("file")
const postFile: RequestHandler = (req: reqWithUserinfo, res) => {
    upload(req, res, async (err: any) => {
        if (err) {
            console.error("Media upload error: ", err)
            return res.status(500).json({
                message: "Internal server error"
            })
        }

        console.log(req.params.chatId, req.file, req.body);

        if (!await checkUserInChat(req.userinfo.ID, parseInt(req.params.chatId as string))) {
            return res.status(403).json({
                message: "You are not allowed to upload files to this chat"
            })
        }

        await pool.promise().query("INSERT INTO chat_files (uuid, type, chatId) VALUES (?,?,?)", [req.file.filename, req.body.type, req.params.chatId])
        res.json({ assetId: req.file.filename })
    })
}


export default postFile;