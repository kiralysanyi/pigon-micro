import { Request } from "express";
import { userdata } from "./userdata";

interface reqWithUserinfo extends Request {
    userinfo?: userdata
}

export type {reqWithUserinfo};