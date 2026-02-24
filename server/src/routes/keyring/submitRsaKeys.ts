import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { validationResult } from "express-validator";
import { pool } from "../../utils/db/db";

const submitRsaKeys: RequestHandler = (req: reqWithUserinfo, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            success: false,
            validation: result.mapped()
        })
    }

    pool.query("INSERT INTO rsa_keys (userID, public, private) VALUES (?,?,?)", [req.userinfo.ID, req.body.public, req.body.private], (err) => {
        if (err) {
            console.error("Failed to upload rsa keys: ", err);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            })
        }

        return res.status(201).json({
            success: true
        })
    })
}

export default submitRsaKeys;