import axios from "axios";
import { wrapMasterKey } from "./masterkey";
import getAccessToken from "../auth/getAccessToken";
import { BASEURL } from "../../conf";

const uploadMasterKey = async (masterKey: CryptoKey, kpass: string): Promise<void> => {
    const encrypted = await wrapMasterKey(masterKey, kpass);
    const token = await getAccessToken();
    await axios.post(BASEURL + "/keyring/masterkey", { masterKey: encrypted }, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } })
    return;
}

export default uploadMasterKey;