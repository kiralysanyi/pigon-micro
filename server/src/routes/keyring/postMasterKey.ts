import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { validationResult } from "express-validator";
import { pool } from "../../utils/db/db";

const postMasterKey: RequestHandler = (req: reqWithUserinfo, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            success: false,
            validation: result.mapped()
        })
    }

    pool.query("UPDATE users SET masterKey = ? WHERE ID = ?", [req.body.masterKey, req.userinfo.ID], (err) => {
        if (err) {
            console.error("Failed to post masterkey: ", err)
            return res.status(500).json({
                message: "Internal server error"
            })
        }

        return res.status(201).json({
            message: "Masterkey has been set successfully"
        })
    })
}

export default postMasterKey;