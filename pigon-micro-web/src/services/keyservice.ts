import axios from "axios";
import { deriveSharedKey } from "../lib/encryption/ecdh";
import { importECDHPrivateKeyFromBase64, importECDHPublicKeyFromBase64 } from "../lib/encryption/utils";
import { BASEURL } from "../conf";
import getAccessToken from "../lib/auth/getAccessToken";
import getUserInfo from "../lib/auth/getUserInfo";
import { masterDecrypt } from "../lib/encryption/masterkey";
import type { DKeyWrapper } from "../types/DKeyWrapper";


const getGroupEncryptKey = (chatID: number, privKey: CryptoKey): Promise<{ key: CryptoKey, kGuid: string }> => {
    return new Promise(async (resolve, reject) => {
        const token = await getAccessToken();
        axios.get(BASEURL + `/api/v1/keyring/groupkeys/${chatID}/0`, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }).then(async (response) => {
            const data = response.data.key;
            console.log(data)
            const creatorUserData = await getUserInfo(data.creatorId);
            const pubKey = await importECDHPublicKeyFromBase64(creatorUserData.pubKey);
            const sharedKey = await deriveSharedKey(privKey, pubKey);
            resolve({ key: sharedKey, kGuid: data.kGuid });
        }).catch((err) => {
            reject(err)
        })
    })
}

const getGroupDecryptKey = (chatID: number, kGuid: string, privKey: CryptoKey): Promise<CryptoKey> => {
        return new Promise(async (resolve, reject) => {
        const token = await getAccessToken();
        axios.get(BASEURL + `/api/v1/keyring/groupkeys/${chatID}/${kGuid}`, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }).then(async (response) => {
            const data = response.data.key;
            console.log(data)
            const creatorUserData = await getUserInfo(data.creatorId);
            const pubKey = await importECDHPublicKeyFromBase64(creatorUserData.pubKey);
            const sharedKey = await deriveSharedKey(privKey, pubKey);
            resolve(sharedKey);
        }).catch((err) => {
            reject(err)
        })
    })
}

const loadedKeys: DKeyWrapper[] = []

const getMessageDecryptionKey = async (senderKeyId: number, recipientKeyId: number, senderID: number, masterKey: CryptoKey): Promise<CryptoKey> => {
    const startTime = new Date();
    const userinfo = await getUserInfo();

    let myKeyID = recipientKeyId;
    let remoteKeyID = senderKeyId;

    const loaded = loadedKeys.filter((k) => (k.idA == senderKeyId && k.idB == recipientKeyId) || (k.idA == recipientKeyId && k.idB == senderKeyId))[0]
    if (loaded) {
        console.log("keyservice: Key loaded from cache")
        return loaded.dkey;
    }

    if (senderID == userinfo.ID) {
        myKeyID = senderKeyId;
        remoteKeyID = recipientKeyId;
    }

    const myKeys = (await axios.get(BASEURL + "/api/v1/keyring/chatkeys/self", { headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getAccessToken()}` } })).data.keys as any[];
    const remoteKey = (await axios.get(BASEURL + "/api/v1/keyring/chatkeys/key/" + remoteKeyID, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getAccessToken()}` } })).data.keyData as any;




    // ecdh keys
    const myEncryptedKey = (myKeys.filter((key) => key.keyID == myKeyID))[0].encryptedPrivKey; // encrypted json
    const remotePubKey = remoteKey.pubKey; // base64 exported

    const pubKey = await importECDHPublicKeyFromBase64(remotePubKey);
    const privKey = await importECDHPrivateKeyFromBase64(await masterDecrypt(myEncryptedKey, masterKey));

    const shared = await deriveSharedKey(privKey, pubKey);
    const endTime = new Date();

    console.log("Shared key derivation took: ", `${endTime.getTime() - startTime.getTime()}ms`);
    if (!loaded) {
        loadedKeys.push({
            dkey: shared,
            idA: senderKeyId,
            idB: recipientKeyId
        })
    }
    return shared
}

const getNewMessageEncryptionKey = async (recipientID: number, masterKey: CryptoKey) => {
    const myKeys = (await axios.get(BASEURL + "/api/v1/keyring/chatkeys/self", { headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getAccessToken()}` } })).data.keys as any[];
    const remoteKeys = (await axios.get(BASEURL + "/api/v1/keyring/chatkeys/user/" + recipientID, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getAccessToken()}` } })).data.keys as any[];

    // ecdh keys
    const myActiveEncryptedKey = (myKeys.filter((key) => key.status == "active"))[0]; // encrypted json
    const remoteActivePubKey = (remoteKeys.filter((key) => key.status == "active"))[0]; // base64 exported

    const pubKey = await importECDHPublicKeyFromBase64(remoteActivePubKey.pubKey);
    const privKey = await importECDHPrivateKeyFromBase64(await masterDecrypt(myActiveEncryptedKey.encryptedPrivKey, masterKey));

    const shared = await deriveSharedKey(privKey, pubKey);
    return {
        key: shared,
        senderKeyId: myActiveEncryptedKey.keyID,
        recipientKeyId: remoteActivePubKey.keyID
    };
}

export {
    getNewMessageEncryptionKey,
    getMessageDecryptionKey,
    getGroupDecryptKey,
    getGroupEncryptKey
}