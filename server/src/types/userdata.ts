interface userdata {
    ID: number,
    username: string,
    password?: string,
    pubKey: string,
    encryptedPrivKey?: string
    created_at: Date,
    updated_at: Date
}

export type {userdata}