import express from "express";
import getFile from "./getFile";
import postFile from "./postFile";
// TODO: implement
const cdnRouter = express.Router();

cdnRouter.get("/:id", getFile);
cdnRouter.post("/:id", postFile);

export default cdnRouter;