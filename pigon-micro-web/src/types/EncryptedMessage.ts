/*
Notes on keyids
keyId: should be used in group chats (uuid);
senderKeyId and recipientKeyId should be used in private chats (number)
*/

interface EncryptedMessage {
    chatID: number,
    date: string,
    messageID: number,
    payload: string,
    senderID: number,
    keyId?: string,
    senderKeyId?: number,
    recipientKeyId?: number,
    type: "text" | "file" | "video" | "image"
}

export type { EncryptedMessage }