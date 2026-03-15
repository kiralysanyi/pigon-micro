import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { getUser } from "../../utils/db/user";

const infoHandler: RequestHandler = async (req: reqWithUserinfo, res) => {
    if (req.userinfo) {

        // if id specified in search params then get that specific user
        if (req.query.id != undefined) {
            try {
                let userID = parseInt(req.query.id as string)
                const user = await getUser(userID);
                if (user == false) {
                    return res.status(404).json({
                        message: "User not found"
                    })
                }

                return res.json({
                    success: true,
                    data: user
                })
            } catch (error) {
                return res.status(500).json({
                    message: "Failed to process request"
                })
            }
        }

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