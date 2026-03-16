import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { pool } from "../../utils/db/db";
import { RowDataPacket } from "mysql2";

const getChatKeys: RequestHandler = (req: reqWithUserinfo, res) => {
    let keyid: number;

    if (req.params.keyid) {
        keyid = parseInt(req.params.keyid as string)
    }

    let userID: number;

    if (req.params.userid) {
        userID = parseInt(req.params.userid as string)
    }

    if (keyid) {
        // get key by userid / keyid
        // Note: if keyid specified we do not return private keys
        pool.query<RowDataPacket[]>("SELECT keyID, userID, pubKey, status, created_at FROM chat_keys WHERE keyID = ?", [keyid], (err, result) => {
            if (err) {
                console.error("Failed to get key: ", err);
                return res.status(500).json({
                    message: "Internal server error"
                })
            }

            if (result.length == 0) {
                return res.status(404).json({
                    message: "Key not found"
                })
            }

            return res.json({
                keyData: result[0]
            })
        })

        return;
    } else {

        // if userid specified then get public keys for user

        if (userID) {
            pool.query<RowDataPacket[]>("SELECT keyID, userID, pubKey, status, created_at FROM chat_keys WHERE userID = ?", [userID], (err, result) => {
                if (err) {
                    console.error("Failed to get keys: ", err);
                    return res.status(500).json({
                        message: "Internal server error"
                    })
                }

                return res.json({
                    keys: result
                })
            });

            return;
        }

        // get all chatkeys for user
        pool.query<RowDataPacket[]>("SELECT * FROM chat_keys WHERE userID = ?", [req.userinfo.ID], (err, result) => {
            if (err) {
                console.error("Failed to get keys: ", err);
                return res.status(500).json({
                    message: "Internal server error"
                })
            }

            return res.json({
                keys: result
            })
        })
    }
}

export default getChatKeys;