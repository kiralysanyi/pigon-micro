import { wrapMasterKey } from "./masterkey";
import { BASEURL } from "../../conf";
import api from "../../services/apiservice";

const uploadMasterKey = async (masterKey: CryptoKey, kpass: string): Promise<void> => {
    const encrypted = await wrapMasterKey(masterKey, kpass);
    await api.post(BASEURL + "/keyring/masterkey", { masterKey: encrypted })
    return;
}

export default uploadMasterKey;