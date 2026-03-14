import express from "express";
import createChat from "./createChat";
import { body } from "express-validator";
import getChats from "./getChats";

const chatRouter = express.Router();

chatRouter.post("/", body("targetID").notEmpty().withMessage("targetID field required"), createChat)
chatRouter.get("/", getChats)

export default chatRouter;