interface EncryptedMessage {
    chatID: number,
    date: string,
    messageID: number,
    payload: string,
    senderID: number,
    type: "text" | "file" | "video" | "image"
}

export type { EncryptedMessage }