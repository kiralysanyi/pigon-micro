import { RequestHandler } from "express";
import { reqWithUserinfo } from "../../types/reqWithUserinfo";
import { PushSubscription } from "web-push";
import { subscribe } from "../../utils/webpush";

const subscribeHandler: RequestHandler = (req: reqWithUserinfo, res) => {
    const sub: PushSubscription = req.body.sub;

    try {
        if (!sub.endpoint || !sub.keys || !sub.keys.auth || !sub.keys.p256dh) {
            return res.status(400).json({
                message: "Bad request"
            })
        }
    } catch (error) {
        return res.status(400).json({
            message: "Bad request"
        })
    }

    subscribe(req.userinfo.ID, sub);
    return res.status(201).json({
        message: "Subscribed to push notifications"
    })
}

export default subscribeHandler;