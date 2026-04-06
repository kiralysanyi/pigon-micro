interface encryptedFile {
    iv: Uint8Array;
    ciphertext: ArrayBuffer;
}

export type { encryptedFile }