import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { pool } from "../../utils/db/db";
import { pfpUpload } from "../../utils/multer";
import multer from "multer";

const upload = pfpUpload.single("image");

const postPfp: RequestHandler = (req: reqWithUserinfo, res) => {
    // upload handler
    upload(req, res, (err) => {
        // error handling
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading (e.g., file too large)
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({
                    // TODO: read max size from config
                    message: "File is too large. Max limit is 1MB."
                });
            }
            return res.status(400).json({ message: err.message });
        } else if (err) {
            // An unknown error occurred
            return res.status(500).json({ message: "Server malfunctioned" });
        }

        // save to db, return

        pool.query("DELETE FROM profile_picture WHERE userId = ?", [req.userinfo.ID], (err) => {
            if (err) {
                console.error("Failed to index pfp: ", err);
                return res.status(500).json(
                    { message: "Internal server error" }
                )
            }

            pool.query("INSERT INTO profile_picture (userId, filename) VALUES (?,?)", [req.userinfo.ID, req.file.filename], (err) => {
                if (err) {
                    console.error("Failed to index pfp: ", err);
                    return res.status(500).json(
                        { message: "Internal server error" }
                    )
                }

                return res.json({ message: "Uploaded pfp" });
            })
        })
    })


}

export default postPfp;