import axios from "axios";
import { deriveSharedKey } from "../lib/encryption/ecdh";
import { exportKeyToBase64, importECDHPrivateKeyFromBase64, importECDHPublicKeyFromBase64 } from "../lib/encryption/utils";
import { BASEURL } from "../conf";
import getAccessToken from "../lib/auth/getAccessToken";
import getUserInfo from "../lib/auth/getUserInfo";
import { masterDecrypt } from "../lib/encryption/masterkey";
import type { DKeyWrapper } from "../types/DKeyWrapper";

// get shared "key" for a specific chat, if its a private chat we use ecdh, if group then we get it from the encrypted blob with rsa decrypt,
// or if its saved we use that, but with ecdh we always calculate.
// This garbage always returns a base64 string, for now we use the base64 itself as the shared key, later on i may make it more optimal

const getSharedKey = (chatID: number): Promise<string> => {
    // TODO: make this group chat compatible
    return new Promise(async (resolve, reject) => {
        // todo: get chat info
        axios.get(BASEURL + "/api/v1/chat/" + chatID, { headers: { Authorization: `Bearer ${await getAccessToken()}` } }).then(async (response) => {
            const participants = response.data.chat.participants;

            // get current user's ID.
            const userInfo = await getUserInfo();


            const targetID = participants.filter((p: any) => p.id != userInfo.ID)[0].id

            console.log("gsk targetID: ", targetID)

            // get private key of current user
            const savedPrivKey = sessionStorage.getItem("privKey");
            axios.get(BASEURL + "/api/v1/keyring/pubkey?userID=" + targetID, { headers: { Authorization: `Bearer ${await getAccessToken()}` } }).then(async (result) => {
                console.log("Keyring, remote: ", result.data)
                let remotePubKey = result.data.data.pubKey;
                const privKey = savedPrivKey ? await importECDHPrivateKeyFromBase64(savedPrivKey) : null;
                const pubKey = remotePubKey ? await importECDHPublicKeyFromBase64(remotePubKey) : null;

                if (privKey == null || pubKey == null) {
                    console.error("One of the ecdh keys are not in the session storage, aborting...", privKey, pubKey)
                    return reject("Failed to get shared key for chat: " + chatID);
                }

                const shared = await deriveSharedKey(privKey, pubKey);

                resolve(exportKeyToBase64(shared))
            })
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
    getSharedKey,
    getNewMessageEncryptionKey,
    getMessageDecryptionKey
}