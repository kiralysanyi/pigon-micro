// file encrypt stuff

import type { encryptedFile } from "../../../types/encryptedFile";
import { unpackEncryptedFile } from "./filePack";

async function encryptFile(file: File, key: CryptoKey): Promise<encryptedFile> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        await file.arrayBuffer()
    );
    console.log(file.name)
    const ext = file.name.split('.')[file.name.split('.').length - 1];
    console.log("Encrypt|extension: ", ext)
    return { iv, ciphertext, extension: ext };
}

async function decryptFile(packed: ArrayBuffer, key: CryptoKey): Promise<File> {
    const { iv, ciphertext, extension } = unpackEncryptedFile(packed);
    //"image/png,image/jpeg,image/jpg,image/webp,image/gif,video/mp4,video/webp"
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv as Uint8Array<ArrayBuffer> },
        key,
        ciphertext
    );

    const MIME_MAP: Record<string, string> = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        webp: "image/webp",
        gif: "image/gif",
        mp4: "video/mp4",
    };

    const mime = MIME_MAP[extension] ?? "application/octet-stream";

    const uid = window.crypto.randomUUID();

    return new File([decrypted], `${uid}.${extension}`, { type: mime });
}

export { encryptFile, decryptFile }