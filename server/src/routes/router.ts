import express from "express";
import authRouter from "./auth/authRouter";
import verifyAccessMiddleware from "../middlewares/verifyAccess";
import keyringRouter from "./keyring/keyringRouter";
import chatRouter from "./chat/chatRouter";
import cdnRouter from "./cdn/cdnRouter";
import pushRouter from "./push/pushRouter";

const apiRouter = express.Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/keyring", verifyAccessMiddleware, keyringRouter);
apiRouter.use("/chat", verifyAccessMiddleware, chatRouter);
apiRouter.use("/cdn", verifyAccessMiddleware, cdnRouter);
apiRouter.use("/push", verifyAccessMiddleware, pushRouter);

export { apiRouter };