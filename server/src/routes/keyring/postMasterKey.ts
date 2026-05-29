import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { validationResult } from "express-validator";
import { pool } from "../../utils/db/db";

const postMasterKey: RequestHandler = async (req: reqWithUserinfo, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            success: false,
            validation: result.mapped()
        })
    }

    try {
        await pool.promise().query("UPDATE users SET masterKey = ? WHERE ID = ?", [req.body.masterKey, req.userinfo.ID]);

        return res.status(201).json({
            message: "Masterkey has been set successfully"
        })
    } catch (err) {
        console.error("Failed to post masterkey: ", err)
        return res.status(500).json({
            message: "Internal server error"
        })
    }

}

export default postMasterKey;