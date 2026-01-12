interface encryptedData {
    salt: string,
    iv: string, 
    ciphertext: string
}

export type {
    encryptedData
}