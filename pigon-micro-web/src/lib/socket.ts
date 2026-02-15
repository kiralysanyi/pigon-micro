import { io } from "socket.io-client";
import getAccessToken from "./auth/getAccessToken";

//Todo: configure properly
const socket = io("localhost:8080", { path: "/socket", extraHeaders: { "Authorization": `Bearer ${await getAccessToken()}` } });

socket.on("connect_error", (err) => {
    console.error(err);
});

socket.on("error", (err) => {
    console.error(err);
})

socket.on("connected", () => {
    console.log("Socket connected")
})


export { socket }