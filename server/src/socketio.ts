import { Server } from "http";
import * as SocketIO from "socket.io"
import { verifyAccessToken } from "./utils/db/session";
import { ExtendedSocket } from "./types/ExtendedSocket";
import { getParticipants } from "./utils/db/chat";
import { pool } from "./utils/db/db";

const attachSocketio = (server: Server) => {
    console.log("Attaching socket.io")
    const io = new SocketIO.Server(server, { path: "/socket", cors: { origin: "*" } })

    //auth

    io.use((socket: ExtendedSocket, next) => {
        console.log("Verifying new connection")
        const token = socket.request.headers["authorization"] ? socket.request.headers["authorization"].split(' ')[1] : null;

        if (!token) {
            console.log("No token")
            return next(new Error("No token provided"))
        }

        // verify access token
        verifyAccessToken(token).then((userdata) => {
            console.log("Token verified, socketio connected")
            socket.authenticated = true;
            socket.userinfo = userdata;
            socket.join("usr" + userdata.ID)
            console.log("Socket authenticated: ", socket.id);
            next();
        }).catch((err) => {
            console.log("Invalid token")
            console.error(err);
            socket.authenticated = false;
            next(new Error("Authentication failed: " + err))
        })

    })

    io.on('connection', (socket: ExtendedSocket) => {
        console.log("Socket connected: ", socket.id, socket.authenticated)

        socket.on("message", async ({ payload, chatID, senderKeyId, recipientKeyId, kGuid }: { payload: string, chatID: number, senderKeyId?: number, recipientKeyId?: number, kGuid?: string }) => {

            if ((senderKeyId == undefined || recipientKeyId == undefined) && kGuid == undefined) {
                console.log("Invalid message dropped")
                return;
            }

            console.log(payload, `${socket.userinfo.ID} -->> ${chatID}`)

            // get chat participants
            const participants = await getParticipants(chatID)

            const filteredParticipants = participants.filter((p) => p.id != socket.userinfo.ID);

            // send message to recipient devices
            filteredParticipants.forEach((p) => {
                io.to("usr" + p.id).emit("message", payload, chatID, socket.userinfo.ID, senderKeyId, recipientKeyId)
            })

            // save to db
            const msgType = "text"

            if (kGuid == undefined) {
                // private message
                pool.query("INSERT INTO messages (chatID, senderID, type, message, senderKeyId, recipientKeyId) VALUES (?,?,?,?,?,?)", [chatID, socket.userinfo.ID, msgType, payload, senderKeyId, recipientKeyId], (err) => {
                    if (err) {
                        console.error("Failed to save message", err);
                        return;
                    }
                    // saved message send ack or something
                });
            } else {
                // group message
                pool.query("INSERT INTO messages (chatID, senderID, type, message, kGuid) VALUES (?,?,?,?,?)", [chatID, socket.userinfo.ID, msgType, payload, kGuid], (err) => {
                    if (err) {
                        console.error("Failed to save message", err);
                        return;
                    }
                    // saved message send ack or something
                });
            }
        })
    });
}

export default attachSocketio;