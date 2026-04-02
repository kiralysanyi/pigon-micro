import { deriveSharedKey, ecdhDecryptKey } from "../lib/encryption/ecdh";
import { importECDHPrivateKeyFromBase64, importECDHPublicKeyFromBase64 } from "../lib/encryption/utils";
import getUserInfo from "../lib/auth/getUserInfo";
import { masterDecrypt } from "../lib/encryption/masterkey";
import type { DKeyWrapper } from "../types/DKeyWrapper";
import api from "./apiservice";


const getGroupEncryptKey = (chatID: number, privKey: CryptoKey): Promise<{ key: CryptoKey, kGuid: string }> => {
    return new Promise(async (resolve, reject) => {
        api.get(`/keyring/groupkeys/${chatID}/0`).then(async (response) => {
            const data = response.data.key;
            console.log(data)
            const creatorUserData = await getUserInfo(data.creatorId);
            const creatorPub = await importECDHPublicKeyFromBase64(creatorUserData.pubKey);
            const sharedSecret = await deriveSharedKey(privKey, creatorPub);
            const groupKey = await ecdhDecryptKey(data.encryptedKey, sharedSecret); // decrypt the actual AES key
            resolve({ key: groupKey, kGuid: data.kGuid })

        }).catch((err) => {
            reject(err)
        })
    })
}


const GKeys: Record<string, CryptoKey> = {}

const getGroupDecryptKey = (chatID: number, kGuid: string, privKey: CryptoKey): Promise<CryptoKey> => {
    return new Promise(async (resolve, reject) => {
        if (GKeys[kGuid]) {
            return resolve(GKeys[kGuid])
        }
        api.get(`/keyring/groupkeys/${chatID}/${kGuid}`).then(async (response) => {
            const data = response.data.key;
            const creatorUserData = await getUserInfo(data.creatorId);
            const pubKey = await importECDHPublicKeyFromBase64(creatorUserData.pubKey);
            const sharedSecret = await deriveSharedKey(privKey, pubKey);
            const groupKey = await ecdhDecryptKey(data.encryptedKey, sharedSecret);
            GKeys[kGuid] = groupKey;
            resolve(groupKey);
        }).catch(reject)
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

    const myKeys = (await api.get("/keyring/chatkeys/self")).data.keys as any[];
    const remoteKey = (await api.get("/keyring/chatkeys/key/" + remoteKeyID)).data.keyData as any;




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
    const myKeys = (await api.get("/keyring/chatkeys/self")).data.keys as any[];
    const remoteKeys = (await api.get("/keyring/chatkeys/user/" + recipientID)).data.keys as any[];

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