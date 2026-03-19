import express from "express";
import createChat from "./createChat";
import { body } from "express-validator";
import getChats from "./getChats";
import getChatInfo from "./getChatInfo";
import getMessages from "./getMessages";
import createGroup from "./createGroup";

const chatRouter = express.Router();

chatRouter.post("/", body("targetID").notEmpty().withMessage("targetID field required"), createChat)
chatRouter.get("/", getChats);
chatRouter.post("/group", body("chatName").notEmpty().withMessage("chatName field required"), createGroup)

chatRouter.get("/:id", getChatInfo);
chatRouter.get("/:chatID/messages", getMessages);
export default chatRouter;