import { RequestHandler } from "express";
import { verifyAccessToken } from "../utils/db/session";
import { reqWithUserinfo } from "../types/reqWithUserinfo";

const verifyAccessMiddleware: RequestHandler = (req: reqWithUserinfo, res, next) => {
    const token = req.headers["authorization"] ? req.headers["authorization"].split(' ')[1] : null;

    if (token == null) {
        return res.status(401).json({
            success: false
        })
    }

    verifyAccessToken(token).then((userinfo) => {
        req.userinfo = userinfo;
        next()
    }).catch((err) => {
        return res.status(401).json({
            success: false,
            error: err
        })
    })
}

export default verifyAccessMiddleware;