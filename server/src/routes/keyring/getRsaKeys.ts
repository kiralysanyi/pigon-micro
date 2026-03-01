import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { pool } from "../../utils/db/db";

const getRsaKeys: RequestHandler = (req: reqWithUserinfo, res) => {
    // if userid specified then only return specified user's public key
    if (req.query.userID != undefined) {
        return pool.query("SELECT public FROM rsa_keys WHERE userID = ?", [parseInt(req.query.userID as string)], (err, result) => {
            if (err) {
                console.error("Fauled to get rsa public key for user: ", req.query.userID);
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Internal server error"
                })
            }

            return res.json({
                success: true,
                keys: result[0]
            })
        });
    }

    pool.query("SELECT public, private FROM rsa_keys WHERE userID = ?", [req.userinfo.ID], (err, result) => {
        if (err) {
            console.error("Failed to get rsa keys from db: ", err)
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            })
        }

        return res.json({
            success: true,
            keys: result[0]
        })
    })
}

export default getRsaKeys;