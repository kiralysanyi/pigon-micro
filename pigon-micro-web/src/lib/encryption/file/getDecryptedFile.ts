import api from "../../../services/apiservice";
import { getFile, saveFile } from "../../indexedDB/fileDB";
import { decryptFile } from "./fileEncrypt";

// helper function to fetch and decrypt file, returns a blob url
const getDecryptedFile = async (toLoad: string, type: string, dKey: CryptoKey): Promise<string> => {
    try {
        const loadedFile = await getFile(toLoad);
        return URL.createObjectURL(loadedFile);
    } catch (error) {
        console.log("File not found in indexedDB, fetching from server: ", toLoad);
    }

    const response = await api.get(`/cdn/${toLoad}`, { responseType: "arraybuffer" });

    const decryptedFile: File = await decryptFile(response.data, dKey, type);
    const bUrl: string = URL.createObjectURL(decryptedFile);
    saveFile(toLoad, decryptedFile).then(() => {
        console.log("File saved to indexedDB for future use: ", toLoad);
    }).catch((err) => {
        console.error("Failed to save file to indexedDB: ", err);
    });

    return bUrl;
}

export default getDecryptedFile;