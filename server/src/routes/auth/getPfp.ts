import { RequestHandler } from "express";
import path from "path";
import { pool } from "../../utils/db/db";
import { RowDataPacket } from "mysql2";
import { pfpPath } from "../../utils/multer";
import * as fs from "fs";

const getPfp: RequestHandler = async (req, res) => {
    const userId = parseInt(req.params.id as string)
    let src = path.join(__dirname, "../../assets/default_pfp.png")
    console.log(src, isNaN(userId))
    if (isNaN(userId)) {
        return res.sendFile(src);
    }

    try {
        const [result] = await pool.promise().query<RowDataPacket[]>("SELECT filename FROM profile_picture WHERE userId = ?", [userId]);

        if (result.length == 0) {
            return res.sendFile(src);
        }

        if (!fs.existsSync(path.join(pfpPath, result[0].filename))) {
            return res.sendFile(src);
        }

        return res.sendFile(path.join(pfpPath, result[0].filename))
    } catch (error) {
        console.error("Failed to get profile picture", error);
        return res.status(500).json({ error: "Failed to get profile picture" });
    }
}

export default getPfp;