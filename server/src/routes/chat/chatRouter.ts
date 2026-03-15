import express from "express";
import createChat from "./createChat";
import { body } from "express-validator";
import getChats from "./getChats";
import getChatInfo from "./getChatInfo";
import getMessages from "./getMessages";

const chatRouter = express.Router();

chatRouter.post("/", body("targetID").notEmpty().withMessage("targetID field required"), createChat)
chatRouter.get("/", getChats);
chatRouter.get("/:id", getChatInfo);
chatRouter.get("/:chatID/messages", getMessages);

export default chatRouter;