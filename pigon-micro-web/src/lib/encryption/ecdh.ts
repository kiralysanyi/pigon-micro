// encryption code

import type { encryptedData } from "../../types/encryptedData";

// Convert string helpers
const enc = new TextEncoder();

// Derive a crypto key from the password
async function deriveKey(password: string, salt: BufferSource) {
    const baseKey = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

// encrypt text with ecdh key
async function encryptMsg(message: string, key: CryptoKey): Promise<encryptedData> {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    const encoded = new TextEncoder().encode(message);

    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoded
    );

    return {
        iv: btoa(String.fromCharCode(... new Uint8Array(iv))),
        ciphertext: btoa(String.fromCharCode(... new Uint8Array(ciphertext)))
    };
}

async function decryptMsg(data: encryptedData, key: CryptoKey): Promise<string> {
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: Uint8Array.from(atob(data.iv), c => c.charCodeAt(0)) },
        key,
        Uint8Array.from(atob(data.ciphertext), c => c.charCodeAt(0))
    );

    return new TextDecoder().decode(decrypted);
}

// encryption code end



// ECDH stuff

// Generate an ECDH key pair (P-256)
async function generateECDHKeyPair() {
    return crypto.subtle.generateKey(
        {
            name: "ECDH",
            namedCurve: "P-256"
        },
        true, // extractable
        ["deriveKey"]
    );
}

// Derive a shared AES-GCM key using your private key and their public key
async function deriveSharedKey(privateKey: CryptoKey, publicKey: CryptoKey) {
    return crypto.subtle.deriveKey(
        {
            name: "ECDH",
            public: publicKey
        },
        privateKey,
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    );
}



export { generateECDHKeyPair, deriveSharedKey, deriveKey, encryptMsg, decryptMsg }