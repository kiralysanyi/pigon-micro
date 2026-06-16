import type { userdataBrief } from "./userdataBrief";

// type used in index page. you retrieve this data from /api/v1/chat
interface ChatinfoBrief {
    chatID: number,
    name: string,
    participants: userdataBrief[]
    type: "group" | "direct",
    hasUnread: boolean
}

export type { ChatinfoBrief }