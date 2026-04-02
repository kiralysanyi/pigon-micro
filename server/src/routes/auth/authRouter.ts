import express from "express";
import registerHandler from "./register";
import { body } from "express-validator";
import loginHandler from "./login";
import tokenHandler from "./token";
import refreshTokenHandler from "./refreshtoken";
import verifyAccessMiddleware from "../../middlewares/verifyAccess";
import infoHandler from "./info";
import getUsers from "./getUsers";
import logout from "./logout";
import getPfp from "./getPfp";
import postPfp from "./postPfp";

const authRouter = express.Router();

authRouter.post("/register",
    body("username").notEmpty().trim().withMessage("Username field is required"),
    body("password").notEmpty().withMessage("Password field is required"),
    body("password").isLength({ min: 8 }).withMessage("Password should be at least 8 characters long."),
    registerHandler)

authRouter.post("/login",
    body("username").notEmpty().trim().withMessage("Username field is required"),
    body("password").notEmpty().withMessage("Password field is required"),
    loginHandler)

authRouter.get("/token", tokenHandler);
authRouter.get("/refreshtoken", refreshTokenHandler);
authRouter.get("/info", verifyAccessMiddleware, infoHandler);

authRouter.get("/users", verifyAccessMiddleware, getUsers);

authRouter.post("/logout", verifyAccessMiddleware, logout);

authRouter.get("/pfp/:id", getPfp);
authRouter.post("/pfp", verifyAccessMiddleware, postPfp);


export default authRouter;