import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";

const infoHandler: RequestHandler = (req: reqWithUserinfo, res) => {
    if (req.userinfo) {
        return res.json({
            success: true,
            data: req.userinfo
        })
    } else {
        return res.status(401).json({
            success: false
        })
    }
}

export default infoHandler;