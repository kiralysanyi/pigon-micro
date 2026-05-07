interface Message {
    chatID: number,
    message?: string,
    senderID: number,
    toLoad?: string, // assetid of the file to load, only used for file messages
    date: Date,
    senderName?: string,
    dKey?: CryptoKey, // decryption key for the file, only used for file messages
    type: "text" | "file" | "video" | "image"
}

export type { Message }