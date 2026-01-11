import { RequestHandler } from "express";
import { validationResult } from "express-validator";

const registerHandler: RequestHandler = (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            success: false,
            validation: result.mapped()
        })
    }
}

export default registerHandler;