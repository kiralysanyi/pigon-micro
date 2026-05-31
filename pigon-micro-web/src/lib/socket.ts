import { io, Socket } from "socket.io-client";
import getAccessToken from "./auth/getAccessToken";
import { BASEURL } from "../conf";

let socket: Socket | undefined;

const getSocket = (): Promise<Socket> => {
    return new Promise((resolve, reject) => {
        if (socket) {
            resolve(socket);
        } else {
            getAccessToken().then(async (token: string) => {
                const urlObj = new URL(BASEURL == "/api/v1" ? window.location.origin : BASEURL);
                socket = io(urlObj.protocol + "//" + urlObj.hostname + `${urlObj.port ? `:${urlObj.port}` : ''}`, { path: "/socket", extraHeaders: { "Authorization": `Bearer ${token}` } });
                socket.on("connect_error", (err) => {
                    console.error(err);
                });

                socket.on("error", (err) => {
                    console.error(err);
                })

                socket.on("connected", () => {
                    console.log("Socket connected")
                })

                resolve(socket)
            }).catch((error) => {
                console.error("Socket initialization failed: ", error)
                reject("Failed to initialize socket connection, probabbly no token")
            })
        }
    })
}


export { getSocket }