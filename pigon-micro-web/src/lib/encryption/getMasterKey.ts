import { unwrapMasterKey } from "./masterkey";
import api from "../../services/apiservice";

const getMasterKey = async (kpass: string): Promise<CryptoKey> => {
    try {
        const response = await api.get("/keyring/masterkey");
        const encrypted = response.data.masterKey;
        const masterKey = await unwrapMasterKey(encrypted, kpass);
        return masterKey;
    } catch (err) {
        console.error("Failed to get masterkey: ", err);
        throw err;
    }
}

export default getMasterKey;