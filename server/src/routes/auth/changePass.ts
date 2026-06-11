import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { validationResult } from "express-validator";
import changePass_db from "../../utils/db/changePass_db";

const changePass: RequestHandler = async (req: reqWithUserinfo, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            success: false,
            validation: result.mapped()
        })
    }
    const userid = req.userinfo.ID;
    const { old_password, new_password } = req.body;

    try {
        await changePass_db(userid, old_password, new_password);
        return res.json({
            message: "Password changed"
        })
    } catch (error) {
        if (typeof error == "string") {
            return res.status(400).json({
                message: error
            })
        } else {
            console.error(error);
            return res.status(500).json({
                message: "Internal server error"
            })
        }
    }

}

export default changePass;