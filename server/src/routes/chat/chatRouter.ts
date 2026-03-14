import express from "express";
import createChat from "./createChat";
import { body } from "express-validator";
import getChats from "./getChats";
import getChatInfo from "./getChatInfo";

const chatRouter = express.Router();

chatRouter.post("/", body("targetID").notEmpty().withMessage("targetID field required"), createChat)
chatRouter.get("/", getChats);
chatRouter.get("/:id", getChatInfo)

export default chatRouter;