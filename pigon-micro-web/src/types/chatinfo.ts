interface chatinfo {
    id: number,
    type: "group" | "direct",
    name?: string,
    creatorId: number,
    participants: any[]
}

export type {chatinfo}