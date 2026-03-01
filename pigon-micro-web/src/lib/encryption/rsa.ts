// claude generated stuff, i am not willing to tinker with encryption by myself yet, if its broken then i guess i am fucked xD

export async function generateRsaKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function rsaEncrypt(data: string, publicKey: CryptoKey): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, encoded);
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

export async function rsaDecrypt(encryptedData: string, privateKey: CryptoKey): Promise<string> {
  const buffer = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, buffer);
  return new TextDecoder().decode(decrypted);
}

// Helpers to export/import keys as base64 strings for storage or transfer
export async function exportRsaPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("spki", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function exportRsaPrivateKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("pkcs8", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importRsaPublicKey(base64Key: string): Promise<CryptoKey> {
  const buffer = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  return crypto.subtle.importKey("spki", buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]);
}

export async function importRsaPrivateKey(base64Key: string): Promise<CryptoKey> {
  const buffer = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", buffer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["decrypt"]);
}