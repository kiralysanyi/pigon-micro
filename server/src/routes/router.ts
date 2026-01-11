import express from "express";
import authRouter from "./auth/authRouter";

const apiRouter = express.Router();
apiRouter.use("/auth", authRouter);

export {apiRouter};