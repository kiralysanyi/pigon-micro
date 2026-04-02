import { RequestHandler } from "express";
import path from "path";

const getPfp: RequestHandler = (req, res) => {
    // TODO: make this actually working
    const userId = parseInt(req.params.id as string)
    let src = path.join(__dirname, "../../assets/default_pfp.png")
    console.log(src, isNaN(userId))
    return res.sendFile(src)
}

export default getPfp;