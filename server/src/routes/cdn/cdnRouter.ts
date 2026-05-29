import express from "express";
import getFile from "./getFile";
import postFile from "./postFile";

const cdnRouter = express.Router();

cdnRouter.get("/:assetId", getFile);
cdnRouter.post("/:chatId", postFile);

export default cdnRouter;