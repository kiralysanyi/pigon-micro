import { RequestHandler } from "express";
import { getNewToken } from "../../utils/db/session";

const tokenHandler: RequestHandler = async (req, res) => {
    const token = req.headers["authorization"] ? req.headers["authorization"].split(' ')[1] : null;

    if (token == null) {
        return res.status(401).json({
            success: false
        })
    }

    getNewToken(token).then((newToken) => {
        return res.json({
            success: true,
            token: newToken
        })
    }).catch((err) => {
        return res.status(401).json({
            success: false,
            error: err
        })
    })
}

export default tokenHandler;