interface encryptedFile {
    iv: Uint8Array;
    ciphertext: ArrayBuffer;
    extension: string;
}

export type { encryptedFile }