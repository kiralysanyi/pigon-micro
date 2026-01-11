import express from "express";
import registerHandler from "./register";
import { body } from "express-validator";

const authRouter = express.Router();

authRouter.post("/register",
    body("username").notEmpty().trim().withMessage("Username field is required"),
    body("password").notEmpty().withMessage("Password field is required"),
    body("password").isLength({ min: 8 }).withMessage("Password should be at least 8 characters long."),
    registerHandler)


export default authRouter;