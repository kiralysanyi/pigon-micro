import type { encryptedData } from "../../types/encryptedData";

/**
 * Encode encrypted data to base64
 * @param data 
 * @returns 
 */
const encodeEncryptedData = (data: encryptedData) => {
    return btoa(JSON.stringify(data));
}

/**
 * Decode base64 to encrypted data
 * @param encoded 
 * @returns 
 */
const decodeEncryptedData = (encoded: string) => {
    return JSON.parse(atob(encoded))
}

// Export public key to base64
async function exportPublicKeyToBase64(publicKey: CryptoKey) {
    const spki = await crypto.subtle.exportKey("spki", publicKey);
    return btoa(String.fromCharCode(...new Uint8Array(spki)));
}

// Export private key to base64
async function exportPrivateKeyToBase64(privateKey: CryptoKey) {
    const pkcs8 = await crypto.subtle.exportKey("pkcs8", privateKey);
    return btoa(String.fromCharCode(...new Uint8Array(pkcs8)));
}

// Convert base64 to array buffer
function base64ToArrayBuffer(b64: string) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Export key to base64
async function exportKeyToBase64(key: CryptoKey) {
    const raw = await crypto.subtle.exportKey("raw", key);
    const bytes = new Uint8Array(raw);
    return btoa(String.fromCharCode(...bytes));
}

// Import ECDH public key from base64
async function importECDHPublicKeyFromBase64(b64: string): Promise<CryptoKey> {
    const spki = base64ToArrayBuffer(b64);
    return crypto.subtle.importKey(
        "spki",
        spki,
        {
            name: "ECDH",
            namedCurve: "P-256"
        },
        false,
        []
    );
}

// Import ECDH private key from base64
async function importECDHPrivateKeyFromBase64(b64: string): Promise<CryptoKey> {
    const pkcs8 = base64ToArrayBuffer(b64);
    return crypto.subtle.importKey(
        "pkcs8",
        pkcs8,
        {
            name: "ECDH",
            namedCurve: "P-256",
        },
        false,
        ["deriveKey"]
    );
}



export {
    encodeEncryptedData,
    decodeEncryptedData,
    exportPrivateKeyToBase64,
    exportPublicKeyToBase64,
    importECDHPrivateKeyFromBase64,
    importECDHPublicKeyFromBase64,
    base64ToArrayBuffer,
    exportKeyToBase64
}