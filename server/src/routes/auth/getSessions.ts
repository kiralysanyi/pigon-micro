import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { getSessionList } from "../../utils/db/session";

const getSessions: RequestHandler = async (req: reqWithUserinfo, res) => {
    try {
        const sessions = await getSessionList(req.userinfo.ID);
        return res.json({
            sessions
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}

export default getSessions;