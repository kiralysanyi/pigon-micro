import multer from "multer";
import serverConfig from "../config";
import * as fs from "fs";
import { randomUUID } from "crypto";
import path from "path";

//check paths and create if not exists
const pfpPath = serverConfig.USERFILES + "/pfp";
const mediaPath = serverConfig.USERFILES + "/media";

const pfpStorage = multer.diskStorage({
    destination: pfpPath, filename(req, file, callback) {
        callback(null, `${randomUUID()}.${path.extname(file.originalname)}`);
    },
});

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

const pfpUpload = multer({
    storage: pfpStorage, fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif'
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);   // accept
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, GIF are allowed.'));
        }
    }, limits: { fileSize: serverConfig.PFP_MAX_SIZE * 1_000_000 }
});
const mediaUpload = multer({ dest: mediaPath, limits: { fileSize: serverConfig.MEDIA_MAX_SIZE * 1_000_000 } })

export { pfpUpload, mediaUpload, pfpPath, mediaPath }