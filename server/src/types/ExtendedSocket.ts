import { Socket } from "socket.io";
import { userdata } from "./userdata";

interface ExtendedSocket extends Socket {
    authenticated: boolean,
    userinfo?: userdata
}

export type {ExtendedSocket}