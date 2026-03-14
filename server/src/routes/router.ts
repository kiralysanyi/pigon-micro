import express from "express";
import authRouter from "./auth/authRouter";
import verifyAccessMiddleware from "../middlewares/verifyAccess";
import keyringRouter from "./keyring/keyringRouter";
import chatRouter from "./chat/chatRouter";

const apiRouter = express.Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/keyring", verifyAccessMiddleware, keyringRouter);
apiRouter.use("/chat", verifyAccessMiddleware, chatRouter);

export {apiRouter};