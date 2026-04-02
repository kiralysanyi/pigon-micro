import express from "express"
import { body } from "express-validator";
import submitPubKey from "./submitPubKey";
import submitPrivKey from "./submitPrivKey";
import getPrivKey from "./getPrivKey";
import getPubKey from "./getPubKey";
import getMasterKey from "./getMasterKey";
import postMasterKey from "./postMasterKey";
import postChatKeys from "./postChatKeys";
import getChatKeys from "./getChatKeys";
import postGroupKey from "./postGroupKey";
import getGroupKey from "./getGroupKey";

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

keyringRouter.get("/groupkeys/:chatID/:kGuid", getGroupKey);

// optional body field: kGuid
keyringRouter.post("/groupkeys/:chatID",
    body("targetUserId").notEmpty().isNumeric().withMessage("targetUserId field is required and it should be a number"),
    body("encryptedKey").notEmpty().withMessage("encryptedKey field is required"),
    postGroupKey)


export default keyringRouter;