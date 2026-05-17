import { RequestHandler } from "express";
import { validationResult } from "express-validator";
import { createUser } from "../../utils/db/user";

// TODO: add rate limiter to prevent abuse, e.g. express-rate-limit
const registerHandler: RequestHandler = (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            success: false,
            validation: result.mapped()
        })
    }

    // register user
    createUser(req.body.username, req.body.password).then((success) => {
        if (success) {
            res.status(201).json({
                success: true,
                message: "user_created"
            })
        } else {
            res.status(409).json({
                success: false,
                message: "user_exists"
            })
        }
    })
}

export default registerHandler;