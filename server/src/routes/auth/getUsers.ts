import { RequestHandler } from "express";
import { listUsers } from "../../utils/db/user";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";

const getUsers: RequestHandler = (req: reqWithUserinfo, res) => {
    let search = ""
    if (req.query.search) {
        search = req.query.search.toString();
    }
    listUsers(search, 20).then((users) => {
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