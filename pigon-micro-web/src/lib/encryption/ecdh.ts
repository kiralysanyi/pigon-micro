// encryption code

// Convert string helpers
const enc = new TextEncoder();
const dec = new TextDecoder();

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

// Encrypt text
async function encrypt(message: string, password: string) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);

    const cipherBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        enc.encode(message)
    );

    return {
        salt: btoa(String.fromCharCode(...salt)),
        iv: btoa(String.fromCharCode(...iv)),
        ciphertext: btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)))
    };
}

// Decrypt text
async function decrypt({ salt, iv, ciphertext }: { salt: string, iv: string, ciphertext: string }, password: string) {
    const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
    const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    const cipherBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));

    const key = await deriveKey(password, saltBytes);

    const plainBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: ivBytes },
        key,
        cipherBytes
    );

    return dec.decode(plainBuffer);
}

function stringifyEncryptionData({ salt, iv, ciphertext }: { salt: string, iv: string, ciphertext: string }) {
    return `${salt}:${iv}:${ciphertext}`
}


function parseEncryption(data: string) {
    const splitData = data.split(':');
    return {
        salt: splitData[0],
        iv: splitData[1],
        ciphertext: splitData[2]
    }
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

/**
 * Export shared key to string
 * @param key
 * @returns 
 */
async function exportKeyToString(key: CryptoKey): Promise<string> {
    return dec.decode(new Uint8Array(await crypto.subtle.exportKey("raw", key)));
}


export { generateECDHKeyPair, deriveSharedKey, stringifyEncryptionData, parseEncryption, encrypt, decrypt, exportKeyToString}