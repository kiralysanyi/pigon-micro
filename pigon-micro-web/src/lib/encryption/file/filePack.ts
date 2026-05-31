import type { encryptedFile } from "../../../types/encryptedFile";

function packEncryptedFile(encrypted: encryptedFile): Blob {
    // Layout: [12 bytes IV][ciphertext...]
    const packed = new Uint8Array(12 + encrypted.ciphertext.byteLength);
    packed.set(encrypted.iv, 0);
    packed.set(new Uint8Array(encrypted.ciphertext), 12);
    return new Blob([packed]);
}

function unpackEncryptedFile(packed: ArrayBuffer): encryptedFile {
    return {
        iv: new Uint8Array(packed.slice(0, 12)),
        ciphertext: packed.slice(12)
    };
}

export { packEncryptedFile, unpackEncryptedFile };