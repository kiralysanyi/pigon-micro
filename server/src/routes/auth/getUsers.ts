import { RequestHandler } from "express";
import { listUsers } from "../../utils/db/user";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";

const getUsers: RequestHandler = (req: reqWithUserinfo, res) => {
    listUsers("", 20).then((users) => {
        // do not list the user itself, only others
        let filtered = users.filter((user) => user.id != req.userinfo.ID)
        
        return res.status(200).json({
            users: filtered
        })
    }).catch((err) => {
        return res.status(500).json({
            message: "Failed to get user list"
        })
    })
}

export default getUsers;