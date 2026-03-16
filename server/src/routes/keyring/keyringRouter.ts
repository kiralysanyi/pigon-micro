import express from "express"
import { body } from "express-validator";
import submitPubKey from "./submitPubKey";
import submitPrivKey from "./submitPrivKey";
import getPrivKey from "./getPrivKey";
import getPubKey from "./getPubKey";
import submitRsaKeys from "./submitRsaKeys";
import getRsaKeys from "./getRsaKeys";
import getMasterKey from "./getMasterKey";
import postMasterKey from "./postMasterKey";
import postChatKeys from "./postChatKeys";
import getChatKeys from "./getChatKeys";

const keyringRouter = express.Router();

// get masterkey
keyringRouter.get("/masterkey", getMasterKey)

// post masterkey
keyringRouter.post("/masterkey", body("masterKey").notEmpty().withMessage("masterKey field is required. Note: it should be an encrypted base64 string"), postMasterKey);

keyringRouter.post("/pubkey", body("pubKey").notEmpty().withMessage("Pubkey field is required"), submitPubKey);
keyringRouter.post("/privkey", body("encryptedPrivKey").notEmpty().withMessage("encryptedPrivKey field is required"), submitPrivKey);
keyringRouter.get("/privkey", getPrivKey);
keyringRouter.get("/pubkey", getPubKey);

// /chatkeys/self

keyringRouter.get("/chatkeys/self", getChatKeys);

// post /chatkeys/self

keyringRouter.post("/chatkeys/self", body("pubKey").notEmpty().withMessage("pubKey field required"), body("encryptedPrivKey").notEmpty().withMessage("encryptedPrivKey field required"), postChatKeys)

keyringRouter.get("/chatkeys/key/:keyid", getChatKeys);

keyringRouter.get("/chatkeys/user/:userid", getChatKeys);


// TODO: remove later
keyringRouter.post("/rsa/keys",
    body("public").notEmpty().withMessage("public field required"),
    body("private").notEmpty().withMessage("private field required"),
    submitRsaKeys
)

// TODO: remove later
keyringRouter.get("/rsa/keys", getRsaKeys)

export default keyringRouter;