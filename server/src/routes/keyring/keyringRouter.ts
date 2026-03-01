import express from "express"
import { body } from "express-validator";
import submitPubKey from "./submitPubKey";
import submitPrivKey from "./submitPrivKey";
import getPrivKey from "./getPrivKey";
import getPubKey from "./getPubKey";
import getKeys from "./getKeys";
import submitKeys from "./submitKeys";
import submitRsaKeys from "./submitRsaKeys";
import getRsaKeys from "./getRsaKeys";

const keyringRouter = express.Router();

keyringRouter.post("/pubkey", body("pubKey").notEmpty().withMessage("Pubkey field is required"), submitPubKey);
keyringRouter.post("/privkey", body("encryptedPrivKey").notEmpty().withMessage("encryptedPrivKey field is required"), submitPrivKey);
keyringRouter.get("/privkey", getPrivKey);
keyringRouter.get("/pubkey", getPubKey);
keyringRouter.get("/keys", getKeys);
keyringRouter.post("/keys",
    body("chatID").notEmpty().withMessage("chatID required"),
    body("key").notEmpty().withMessage("key required"),
    body("type").notEmpty().withMessage("type required"),
    submitKeys);

keyringRouter.post("/rsa/keys",
    body("public").notEmpty().withMessage("public field required"),
    body("private").notEmpty().withMessage("private field required"),
    submitRsaKeys
)

keyringRouter.get("/rsa/keys", getRsaKeys)

export default keyringRouter;