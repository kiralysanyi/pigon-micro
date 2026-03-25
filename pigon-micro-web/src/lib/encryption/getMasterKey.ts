import { unwrapMasterKey } from "./masterkey";
import api from "../../services/apiservice";

const getMasterKey = (kpass: string): Promise<CryptoKey> => {
    return new Promise(async (resolve, reject) => {
        api.get("/api/v1/keyring/masterkey").then((response) => {
            const encrypted = response.data.masterKey;
            unwrapMasterKey(encrypted, kpass).then((masterKey) => {
                resolve(masterKey)
            }).catch((err) => {
                console.error("Failed to unwrap masterkey: ", err)
                reject(err)
            })
        }).catch((err) => {
            console.error("Failed to get masterkey: ", err)
            reject(err)
        })
    })
}

export default getMasterKey;