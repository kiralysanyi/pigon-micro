import multer from "multer";
import serverConfig from "../config";
import * as fs from "fs";
import { randomUUID } from "crypto";
import path from "path";

//check paths and create if not exists
const pfpPath = serverConfig.USERFILES + "/pfp";
const mediaPath = serverConfig.USERFILES + "/media";

const pfpStorage = multer.diskStorage({destination: pfpPath, filename(req, file, callback) {
    callback(null, `${randomUUID()}.${path.extname(file.originalname)}`);
},});

if (!fs.existsSync(serverConfig.USERFILES)) {
    console.error("Userfiles folder does not exist: ", serverConfig.USERFILES);
    throw new Error("Userfiles folder does not exist: " + serverConfig.USERFILES);
}

if (!fs.existsSync(pfpPath)) {
    fs.mkdirSync(pfpPath);
}

if (!fs.existsSync(mediaPath)) {
    fs.mkdirSync(mediaPath);
}

// TODO: make these configurable
const pfpUpload = multer({ storage: pfpStorage, limits: { fileSize: 1_000_000 } });
const mediaUpload = multer({ dest: mediaPath, limits: { fileSize: 100_000_000 } })

export { pfpUpload, mediaUpload, pfpPath, mediaPath }