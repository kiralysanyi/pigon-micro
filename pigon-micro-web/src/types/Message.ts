interface Message {
    chatID: number,
    message: string,
    senderID: number,
    date: Date,
    senderName?: string,
    type: "text" | "file" | "video" | "image"
}

export type { Message }