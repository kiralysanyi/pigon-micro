import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { validationResult } from "express-validator";
import deleteUser from "../../utils/db/deleteUser";

const deleteAccount: RequestHandler = async (req: reqWithUserinfo, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            success: false,
            validation: result.mapped()
        })
    }

    const { password } = req.body;
    try {
        await deleteUser(req.userinfo.ID, password)
        return res.json({ message: "User deleted" })
    } catch (error) {
        console.error(error)
        if (typeof error == "string") {
            return res.status(400).json({ message: error })
        } else {
            return res.status(500).json({ message: "Internal server error" })
        }
    }
}


export default deleteAccount