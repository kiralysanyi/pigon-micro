import { RequestHandler } from "express";
import { validationResult } from "express-validator";
import { loginUser } from "../../utils/db/user";

const loginHandler: RequestHandler = (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            success: false,
            validation: result.mapped()
        })
    }

    loginUser(req.body.username, req.body.password).then(({token, refreshToken}) => {
        return res.json({
            success: true,
            token: token,
            refreshToken: refreshToken
        })
    }).catch((err) => {
        console.error(err);
        return res.status(401).json({
            success: false,
            error: err
        })
    })
}

export default loginHandler;