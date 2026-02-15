import { io } from "socket.io-client";

//Todo: configure properly
const socket = io("localhost:8080", { path: "/socket" });

socket.on("connect_error", (err) => {
    console.error(err);
});

socket.on("error", (err) => {
    console.error(err);
})


export { socket }