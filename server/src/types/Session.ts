interface Session {
    id: number,
    tokenExpire: Date,
    refreshTokenExpire: Date,
    created_at: Date,
    updated_at: Date
}

export type { Session }