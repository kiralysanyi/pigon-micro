/*
Notes on keyids
keyId: should be used in group chats (uuid);
senderKeyId and recipientKeyId should be used in private chats (number)
*/

interface EncryptedMessage {
    chatID: number,
    date: string,
    messageID: number,
    replyTo?: number, // Referencing message ID
    payload: string,
    senderID: number,
    kGuid?: string,
    senderKeyId?: number,
    recipientKeyId?: number,
    type: "text" | "file" | "video" | "image"
}

export type { EncryptedMessage }