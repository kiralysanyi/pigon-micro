import axios from "axios";
import { deriveSharedKey } from "../lib/encryption/ecdh";
import { exportKeyToBase64, importECDHPrivateKeyFromBase64, importECDHPublicKeyFromBase64 } from "../lib/encryption/utils";
import { BASEURL } from "../conf";
import getAccessToken from "../lib/auth/getAccessToken";
import getUserInfo from "../lib/auth/getUserInfo";

// get shared "key" for a specific chat, if its a private chat we use ecdh, if group then we get it from the encrypted blob with rsa decrypt,
// or if its saved we use that, but with ecdh we always calculate.
// This garbage always returns a base64 string, for now we use the base64 itself as the shared key, later on i may make it more optimal
const getSharedKey = (chatID: number): Promise<string> => {
    // TODO: make this group chat compatible
    return new Promise(async (resolve, reject) => {
        // todo: get chat info
        axios.get(BASEURL + "/api/v1/chat/" + chatID, { headers: { Authorization: `Bearer ${await getAccessToken()}` } }).then(async (response) => {
            console.log(response.data)
            const participants = response.data.chat.participants;

            // get current user's ID.
            const userInfo = await getUserInfo();

            const targetID = participants.filter((p: any) => p.id != userInfo.ID)[0].id

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

const getRsaKeys = () => {

}

const getPubRsaKey = (userID: number) => { }


export {
    getSharedKey,
    getRsaKeys,
    getPubRsaKey
}