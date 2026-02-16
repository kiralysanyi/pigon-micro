import { Server } from "http";
import * as SocketIO from "socket.io"
import { verifyAccessToken } from "./utils/db/session";
import { ExtendedSocket } from "./types/ExtendedSocket";

const attachSocketio = (server: Server) => {
    console.log("Attaching socket.io")
    const io = new SocketIO.Server(server, {path: "/socket", cors: {origin: "*"}})

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

        
    });
}

export default attachSocketio;