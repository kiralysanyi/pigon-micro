import express from "express";
import authRouter from "./auth/authRouter";
import verifyAccessMiddleware from "../middlewares/verifyAccess";
import keyringRouter from "./keyring/keyringRouter";

const apiRouter = express.Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/keyring", verifyAccessMiddleware, keyringRouter);

export {apiRouter};