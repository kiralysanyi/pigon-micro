import { generateVAPIDKeys, PushSubscription, sendNotification, setVapidDetails, VapidKeys } from "web-push"
import * as fs from "fs"
import serverConfig from "../config";
import path from "path";

interface UserSubs {
    userId: number,
    subs: PushSubscription[]
}

let keys: VapidKeys;
const keyPath = path.join(serverConfig.USERFILES, "vapid.json");
const subsPath = path.join(serverConfig.USERFILES, "subs.json");
// TODO: move subs to db later for performance
let subs: Record<number, UserSubs> = {}

if (fs.existsSync(subsPath)) {
    subs = JSON.parse(fs.readFileSync(subsPath).toString())
    console.log("Loaded web push subs")
}

const saveSubs = () => {
    fs.writeFileSync(subsPath, JSON.stringify(subs))
}

if (!fs.existsSync(keyPath)) {
    keys = generateVAPIDKeys();
    fs.writeFileSync(keyPath, JSON.stringify(keys));
    console.log("Generated vapid keys and saved to disk")
} else {
    keys = JSON.parse(fs.readFileSync(keyPath).toString())
    console.log("Loaded vapid keys from disk")
}

setVapidDetails('mailto:notimplemented@pigon.ddns.net', keys.publicKey, keys.privateKey);

const subscribe = (userId: number, payload: PushSubscription) => {
    if (!subs[userId]) {
        subs[userId] = {
            userId,
            subs: [payload]
        }
    } else {
        subs[userId].subs.push(payload);
    }

    saveSubs();
}

const sendNotif = (userId: number, title: string, body: string) => {
    if (subs[userId] == undefined) {
        return;
    }

    const userSubs = subs[userId].subs;

    userSubs.forEach(async (sub, index) => {
        try {
            await sendNotification(sub, JSON.stringify({ title, body }), { urgency: "high", TTL: 120 })
        } catch (error) {
            console.error(`Failed to send push notification to user: ${userId} `, error)
            subs[userId].subs.splice(index, 1);
            console.log(`Removed sub: ${userId}/${index}`)
            saveSubs();
        }
    })
}

const getVapidKey = () => {
    return keys.publicKey
}

export { subscribe, sendNotif, getVapidKey };