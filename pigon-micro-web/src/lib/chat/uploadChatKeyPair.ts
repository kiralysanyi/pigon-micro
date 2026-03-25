import axios from "axios";
import { generateECDHKeyPair } from "../encryption/ecdh"
import { masterEncrypt } from "../encryption/masterkey";
import { exportPrivateKeyToBase64, exportPublicKeyToBase64 } from "../encryption/utils";
import { BASEURL } from "../../conf";
import getAccessToken from "../auth/getAccessToken";

/**
 * Create and upload a chat keypair and return the created keypair
 * @param masterKey 
 * @returns 
 */
const uploadChatKeyPair = async (masterKey: CryptoKey): Promise<CryptoKeyPair> => {
    const keypair = await generateECDHKeyPair();
    const privKey = await exportPrivateKeyToBase64(keypair.privateKey);
    const pubKey = await exportPublicKeyToBase64(keypair.publicKey);

    const encryptedPrivKey = await masterEncrypt(privKey, masterKey);

    const token = await getAccessToken();
    await axios.post(BASEURL + "/keyring/chatkeys/self", { pubKey, encryptedPrivKey }, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } });

    return keypair;
}

export default uploadChatKeyPair;