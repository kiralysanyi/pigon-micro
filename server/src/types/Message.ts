interface Message {
    from?: number,
    to: number,
    content: string,
    type: "text"
}

export type {
    Message
}