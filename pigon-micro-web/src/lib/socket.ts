import { io, Socket } from "socket.io-client";
import getAccessToken from "./auth/getAccessToken";

//Todo: configure properly
let socket: Socket | undefined;

const getSocket = (): Promise<Socket> => {
    return new Promise((resolve, reject) => {
        if (socket) {
            resolve(socket);
        } else {
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
                reject("Failed to initialize socket connection, probabbly no token")
            })
        }
    })
}


export { getSocket }