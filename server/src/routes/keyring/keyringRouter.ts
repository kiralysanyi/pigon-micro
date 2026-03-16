import express from "express"
import { body } from "express-validator";
import submitPubKey from "./submitPubKey";
import submitPrivKey from "./submitPrivKey";
import getPrivKey from "./getPrivKey";
import getPubKey from "./getPubKey";
import submitRsaKeys from "./submitRsaKeys";
import getRsaKeys from "./getRsaKeys";

const keyringRouter = express.Router();

// get masterkey

// post masterkey

keyringRouter.post("/pubkey", body("pubKey").notEmpty().withMessage("Pubkey field is required"), submitPubKey);
keyringRouter.post("/privkey", body("encryptedPrivKey").notEmpty().withMessage("encryptedPrivKey field is required"), submitPrivKey);
keyringRouter.get("/privkey", getPrivKey);
keyringRouter.get("/pubkey", getPubKey);

// /chatkeys/self

// post /chatkeys/self/:keyid

// /chatkeys/:userid

// /chatkeys/:userid/:keyid


keyringRouter.post("/rsa/keys",
    body("public").notEmpty().withMessage("public field required"),
    body("private").notEmpty().withMessage("private field required"),
    submitRsaKeys
)

keyringRouter.get("/rsa/keys", getRsaKeys)

export default keyringRouter;