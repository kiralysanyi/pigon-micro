import { io, Socket } from "socket.io-client";
import getAccessToken from "./auth/getAccessToken";
import { BASEURL } from "../conf";

let socket: Socket | undefined;

const getSocket = async (): Promise<Socket> => {
    if (socket) {
        return socket;
    } else {
        const token = await getAccessToken();
        const urlObj = new URL(BASEURL == "/api/v1" ? window.location.origin : BASEURL);
        socket = io(`${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? `:${urlObj.port}` : ''}`, { path: "/socket", extraHeaders: { "Authorization": `Bearer ${token}` } });
        socket.on("connect_error", (err) => {
            console.error(err);
        });

        socket.on("error", (err) => {
            console.error(err);
        })

        socket.on("connected", () => {
            console.log("Socket connected")
        });

        return socket;
    }
}


export { getSocket }