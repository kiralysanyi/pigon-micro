// encryption code

import type { encryptedData } from "../../types/encryptedData";
import type { encryptedFile } from "../../types/encryptedFile";

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

async function ecdhEncryptKey(keyToEncrypt: CryptoKey, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const exportedKey = await crypto.subtle.exportKey("raw", keyToEncrypt);

    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        exportedKey
    );

    return JSON.stringify({
        iv: btoa(String.fromCharCode(...iv)),
        ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
    });
}

async function ecdhDecryptKey(keyToDecrypt: string, key: CryptoKey): Promise<CryptoKey> {
    const { iv, ciphertext } = JSON.parse(keyToDecrypt);

    const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    const ciphertextBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: ivBytes },
        key,
        ciphertextBytes
    );

    return crypto.subtle.importKey(
        "raw",           // was "pkcs8" — matches exportKey("raw") in ecdhEncryptKey
        decrypted,
        { name: "AES-GCM", length: 256 },  // was ECDH — the stored key is an AES key
        true,
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

// file encrypt stuff

async function encryptFile(file: File, key: CryptoKey): Promise<encryptedFile> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        await file.arrayBuffer()
    );

    return { iv, ciphertext };
}


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

async function decryptFile(packed: ArrayBuffer, key: CryptoKey, mimeType: string): Promise<File> {
    const { iv, ciphertext } = unpackEncryptedFile(packed);
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv as Uint8Array<ArrayBuffer> },
        key,
        ciphertext
    );
    return new File([decrypted], "decrypted", { type: mimeType });
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



export { generateECDHKeyPair, deriveSharedKey, deriveKey, encryptMsg, decryptMsg, ecdhEncryptKey, ecdhDecryptKey, encryptFile, decryptFile, packEncryptedFile }