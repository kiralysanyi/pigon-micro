interface userdata {
    ID: number,
    username: string,
    password?: string,
    pubKey: string,
    encryptedPrivKey?: string,
    lastKeyRotation? : Date,
    created_at: Date,
    updated_at: Date
}

export type {userdata}