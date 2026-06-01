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

    return { iv, ciphertext };
}




async function decryptFile(packed: ArrayBuffer, key: CryptoKey, mimeType: string): Promise<File> {
    const { iv, ciphertext } = unpackEncryptedFile(packed);
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv as Uint8Array<ArrayBuffer> },
        key,
        ciphertext
    );
    return new File([decrypted], "decrypted", { type: mimeType });
}

export { encryptFile, decryptFile }