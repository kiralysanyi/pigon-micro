import { RequestHandler } from "express";
import { getVapidKey } from "../../utils/webpush";

const getVapidKeyHandler: RequestHandler = (req, res) => {
    return res.json({
        key: getVapidKey()
    })
}

export default getVapidKeyHandler;