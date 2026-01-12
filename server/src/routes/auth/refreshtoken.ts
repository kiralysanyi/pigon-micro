import { RequestHandler } from "express";
import { getNewRefreshToken } from "../../utils/db/session";

const refreshTokenHandler: RequestHandler = (req, res) => {
    const token = req.headers["authorization"] ? req.headers["authorization"].split(' ')[1] : null;

    if (token == null) {
        return res.status(401).json({
            success: false
        })
    }

    getNewRefreshToken(token).then(({refreshToken, refreshTokenExpire}) => {
        return res.json({
            success: true,
            refreshToken: refreshToken,
            refreshTokenExpire: refreshTokenExpire
        })
    }).catch((err) => {
        return res.status(401).json({
            success: false,
            error: err
        })
    })
}

export default refreshTokenHandler;