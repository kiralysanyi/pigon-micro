const generateMasterKey = (): Promise<CryptoKey> => {
    return crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["wrapKey", "unwrapKey", "encrypt", "decrypt"]
    )
}

const deriveKEK = async (password: string, salt: BufferSource): Promise<CryptoKey> => {
    const baseKey = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["wrapKey", "unwrapKey"]
    );
}

const wrapMasterKey = async (masterKey: CryptoKey, password: string): Promise<string> => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const kek = await deriveKEK(password, salt);
    return crypto.subtle.wrapKey("raw", masterKey, kek, { name: "AES-GCM", iv })
        .then(wrapped => JSON.stringify({
            salt: btoa(String.fromCharCode(...salt)),
            iv: btoa(String.fromCharCode(...iv)),
            key: btoa(String.fromCharCode(...new Uint8Array(wrapped)))
        }))
}

const unwrapMasterKey = async (wrapped: string, password: string): Promise<CryptoKey> => {
    const { iv, key, salt } = JSON.parse(wrapped);
    const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    const keyBytes = Uint8Array.from(atob(key), c => c.charCodeAt(0));
    const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));

    const kek = await deriveKEK(password, saltBytes);


    return crypto.subtle.unwrapKey(
        "raw", keyBytes, kek,
        { name: "AES-GCM", iv: ivBytes },
        { name: "AES-GCM", length: 256 },
        true,
        ["wrapKey", "unwrapKey", "encrypt", "decrypt"]
    )
}

const masterEncrypt = async (data: string, masterKey: CryptoKey): Promise<string> => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        masterKey,
        new TextEncoder().encode(data)
    );
    return JSON.stringify({
        iv: btoa(String.fromCharCode(...iv)),
        data: btoa(String.fromCharCode(...new Uint8Array(encrypted)))
    });
}

const masterDecrypt = async (encrypted: string, masterKey: CryptoKey): Promise<string> => {
    const { iv, data } = JSON.parse(encrypted);
    const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    const dataBytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: ivBytes },
        masterKey,
        dataBytes
    );
    return new TextDecoder().decode(decrypted);
}

const exportMasterToBase64 = async (masterKey: CryptoKey): Promise<string> => {
    const raw = await crypto.subtle.exportKey("raw", masterKey);
    return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

const importMasterFromBase64 = async (base64Key: string): Promise<CryptoKey> => {
    const keyBytes = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    return crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-GCM", length: 256 },
        true,
        ["wrapKey", "unwrapKey", "encrypt", "decrypt"]
    );
}

export { generateMasterKey, wrapMasterKey, unwrapMasterKey, masterDecrypt, masterEncrypt, exportMasterToBase64, importMasterFromBase64 }