import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { deleteSession } from "../../utils/db/session";

const delSession: RequestHandler = async (req: reqWithUserinfo, res) => {
    try {
        await deleteSession(req.userinfo.ID, parseInt(req.params.id as string));
        return res.json({
            success: true,
            message: "Deleted session"
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}

export default delSession;