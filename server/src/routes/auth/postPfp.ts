import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { pool } from "../../utils/db/db";
import { pfpUpload } from "../../utils/multer";
import multer from "multer";
import serverConfig from "../../config";

const upload = pfpUpload.single("image");

const postPfp: RequestHandler = async (req: reqWithUserinfo, res) => {
    // upload handler
    upload(req, res, async (err) => {
        // error handling
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading (e.g., file too large)
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({
                    message: `File is too large. Max limit is ${serverConfig.PFP_MAX_SIZE * 1_000_000}MB.`
                });
            }
            return res.status(400).json({ message: err.message });
        } else if (err) {
            // An unknown error occurred
            return res.status(500).json({ message: "Server malfunctioned" });
        }

        // save to db, return
        try {
            await pool.promise().query("DELETE FROM profile_picture WHERE userId = ?", [req.userinfo.ID]);
            await pool.promise().query("INSERT INTO profile_picture (userId, filename) VALUES (?,?)", [req.userinfo.ID, req.file.filename]);
            return res.json({ message: "Uploaded pfp" });
        } catch (error) {
            console.error("Failed to index pfp: ", error);
            return res.status(500).json(
                { message: "Internal server error" }
            )
        }
    })


}

export default postPfp;