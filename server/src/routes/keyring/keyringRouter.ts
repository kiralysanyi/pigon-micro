import express from "express"
import { body } from "express-validator";
import submitPubKey from "./submitPubKey";
import submitPrivKey from "./submitPrivKey";
import getPrivKey from "./getPrivKey";
import getPubKey from "./getPubKey";

const keyringRouter = express.Router();

keyringRouter.post("/pubkey", body("pubKey").notEmpty().withMessage("Pubkey field is required"), submitPubKey);
keyringRouter.post("/privkey", body("encryptedPrivKey").notEmpty().withMessage("encryptedPrivKey field is required"), submitPrivKey);
keyringRouter.get("/privkey", getPrivKey);
keyringRouter.get("/pubkey", getPubKey);

export default keyringRouter;