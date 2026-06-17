import express from "express";
import subscribeHandler from "./subscribeHandler";
import getVapidKeyHandler from "./getVapidKeyHandler";

const pushRouter = express.Router();

pushRouter.post("/subscribe", subscribeHandler);
pushRouter.get("/vapidkey", getVapidKeyHandler);

export default pushRouter;