import type { encryptedFile } from "../../../types/encryptedFile";

function packEncryptedFile(encrypted: encryptedFile): Blob {
    // Layout: [12 bytes IV][38 bytes Extension][ciphertext...]
    const packed = new Uint8Array(50 + encrypted.ciphertext.byteLength);
    packed.set(encrypted.iv, 0);
    const enc = new TextEncoder();
    packed.set(enc.encode(encrypted.extension), 12);
    packed.set(new Uint8Array(encrypted.ciphertext), 50);
    console.log(packed.slice(12, 50));
    return new Blob([packed]);
}

function unpackEncryptedFile(packed: ArrayBuffer): encryptedFile {
    const dec = new TextDecoder();
    const extSlice = new Uint8Array(packed.slice(12, 50));

    // strip empty data
    console.log(extSlice)
    let end = extSlice.length;
    while (end > 0 && extSlice[end - 1] === 0) end--;
    const ext = dec.decode(extSlice.subarray(0, end));
    console.log("Extension: ", ext);
    console.log(extSlice)
    return {
        iv: new Uint8Array(packed.slice(0, 12)),
        ciphertext: packed.slice(50),
        extension: ext
    };
}

export { packEncryptedFile, unpackEncryptedFile };