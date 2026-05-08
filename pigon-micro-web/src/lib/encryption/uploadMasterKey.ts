import { wrapMasterKey } from "./masterkey";
import api from "../../services/apiservice";

const uploadMasterKey = async (masterKey: CryptoKey, kpass: string): Promise<void> => {
    const encrypted = await wrapMasterKey(masterKey, kpass);
    await api.post("/keyring/masterkey", { masterKey: encrypted })
    return;
}

export default uploadMasterKey;