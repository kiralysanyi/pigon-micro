import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { getUserKeys } from "../../utils/db/keyring";

const getKeys: RequestHandler = (req: reqWithUserinfo, res) => {
    getUserKeys(req.userinfo.ID).then((keys) => {
        return res.json({
            success: true,
            data: keys
        })
    }).catch((error) => {
        console.error("Failed to get keys for user: ", req.userinfo.ID, "Error: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    });
}

export default getKeys;