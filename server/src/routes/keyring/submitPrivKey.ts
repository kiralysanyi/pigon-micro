import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { pool } from "../../utils/db/db";
import { validationResult } from "express-validator";

const submitPrivKey: RequestHandler = async (req: reqWithUserinfo, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            success: false,
            validation: result.mapped()
        })
    }

    try {
        await pool.query("UPDATE users SET encryptedPrivKey = ? WHERE ID = ?", [req.body.encryptedPrivKey, req.userinfo.ID]);
        return res.status(201).json({
            success: true
        })
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        })
    }

}

export default submitPrivKey;