import { Server } from "http";
import * as SocketIO from "socket.io";
import { verifyAccessToken } from "./utils/db/session";
import { ExtendedSocket } from "./types/ExtendedSocket";
import { checkUserInChat, getParticipants } from "./utils/db/chat";
import { pool } from "./utils/db/db";

let io: SocketIO.Server;

const getSocketIOServer = () => {
    if (io) {
        return io;
    } else {
        throw new Error("Socket.io server not initialized");
    }
};
const callTrack: Record<number, boolean> = {};

const attachSocketio = (server: Server) => {
    console.log("Attaching socket.io");
    io = new SocketIO.Server(server, { path: "/socket", cors: { origin: "*" } });

    // Auth

    io.use((socket: ExtendedSocket, next) => {
        console.log("Verifying new connection");
        const token = socket.request.headers["authorization"] ? socket.request.headers["authorization"].split(' ')[1] : null;

        if (!token) {
            console.log("No token");
            return next(new Error("No token provided"));
        }

        // Verify access token
        verifyAccessToken(token).then((userdata) => {
            console.log("Token verified, Socket.io connected");
            socket.authenticated = true;
            socket.userinfo = userdata;
            socket.join(`usr${userdata.ID}`);
            console.log("Socket authenticated:", socket.id);
            next();
        }).catch((err) => {
            console.log("Invalid token");
            console.error(err);
            socket.authenticated = false;
            next(new Error("Authentication failed: " + err));
        });
    });
    io.on('connection', (socket: ExtendedSocket) => {
        console.log("Socket connected:", socket.id, socket.authenticated);

        socket.on("message", async ({ payload, chatID, senderKeyId, recipientKeyId, kGuid, type }: { payload: string, chatID: number, senderKeyId?: number, recipientKeyId?: number, kGuid?: string, type: "text" | "video" | "image" | "file" }) => {
            const msgType = type;
            if ((senderKeyId == undefined || recipientKeyId == undefined) && kGuid == undefined) {
                console.log("Invalid message dropped");
                return;
            }

            // Verify user in chat
            if (!await checkUserInChat(socket.userinfo.ID, chatID)) {
                socket.emit("error", "You are not authorized to send messages to this chat");
                return;
            }

            console.log(payload, `${socket.userinfo.ID} -->> ${chatID}`);

            // Get chat participants
            const participants = await getParticipants(chatID);
            const filteredParticipants = participants.filter((p) => p.id != socket.userinfo.ID);

            if (type != "text") {
                payload = JSON.stringify(payload);
            }

            // Send message to recipient devices
            filteredParticipants.forEach((p) => {
                io.to(`usr${p.id}`).emit("message", { payload, chatID, senderId: socket.userinfo.ID, senderKeyId, recipientKeyId, kGuid, type: msgType });
            });
            // Save to db
            if (kGuid == undefined) {
                // Private message
                try {
                    await pool.promise().query("INSERT INTO messages (chatID, senderID, type, message, senderKeyId, recipientKeyId) VALUES (?,?,?,?,?,?)", [chatID, socket.userinfo.ID, msgType, payload, senderKeyId, recipientKeyId]);
                } catch (error) {
                    console.error("Failed to save message:", error);
                }
            } else {
                // Group message
                try {
                    await pool.promise().query("INSERT INTO messages (chatID, senderID, type, message, kGuid) VALUES (?,?,?,?,?)", [chatID, socket.userinfo.ID, msgType, payload, kGuid]);
                } catch (error) {
                    console.error("Failed to save message:", error);
                }
            }
        });
        // Signaling/call stuff
        socket.on("ring-end", (userId: number) => {
            if (callTrack[userId] == false) {
                return;
            }
            io.to(`usr${userId}`).emit("ring-end");
            callTrack[userId] = false;
        });
        socket.on("ring", (userId: number, chatId: number) => {
            console.log("Ring:", userId);
            let gotResponse = false;
            callTrack[userId] = true;
            io.to(`usr${userId}`).timeout(30_000).emit("ring", { userId, socketId: socket.id, chatId }, (err, responses) => {
                if (gotResponse) {
                    return;
                }

                gotResponse = true;

                callTrack[userId] = false;
                io.to(`usr${userId}`).emit("ring-end");
                if (responses.length == 0) {
                    socket.emit("ring-response", { accepted: false, socketId: "", reason: "not available" });
                    return;
                }
                console.log("Ring response:", err, responses);
                socket.emit("ring-response", responses[0]);
            });
        });
        socket.on("relay", (target: string, payload: any) => {
            io.to(target).emit("relay", { from: socket.id, payload });
        });
    });
};
export default attachSocketio;
export { getSocketIOServer };