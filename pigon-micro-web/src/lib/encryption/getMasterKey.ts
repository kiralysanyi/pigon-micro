import axios from "axios";
import { BASEURL } from "../../conf";
import getAccessToken from "../auth/getAccessToken";
import { unwrapMasterKey } from "./masterkey";

const getMasterKey = (kpass: string): Promise<CryptoKey> => {
    return new Promise(async (resolve, reject) => {
        const token = await getAccessToken();
        axios.get(BASEURL + "/api/v1/keyring/masterkey", {headers: {"Content-Type": "application/json", Authorization: `Bearer: ${token}`}}).then((response) => {
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