interface keyringdata {
    ID: number,
    userID: number,
    type: "shared" | "public" | "private",
    value: string
}

interface keyringIndex {
    ID: number,
    userID: number,
    keyID: number,
    chatID: number
}

export type {
    keyringdata,
    keyringIndex
}