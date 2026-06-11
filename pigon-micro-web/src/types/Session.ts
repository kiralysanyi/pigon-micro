interface Session {
    id: number,
    tokenExpire: string,
    refreshTokenExpire: string,
    created_at: string,
    updated_at: string
}

export type { Session }