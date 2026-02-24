import { io, Socket } from "socket.io-client";
import getAccessToken from "./auth/getAccessToken";

//Todo: configure properly
let socket: Socket | undefined;

getAccessToken().then(async (token: string) => {
    socket = io("localhost:8080", { path: "/socket", extraHeaders: { "Authorization": `Bearer ${token}` } });
    socket.on("connect_error", (err) => {
        console.error(err);
    });

    socket.on("error", (err) => {
        console.error(err);
    })

    socket.on("connected", () => {
        console.log("Socket connected")
    })
}).catch(() => {
    console.log("Failed to initialize socket connection, probabbly no token")
})

const getSocket = () => {
    if (socket) {
        return socket
    } else {
        throw new Error("Socket not initialized yet");
    }
}


export { getSocket }