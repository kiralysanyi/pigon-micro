import { encryptFile, packEncryptedFile } from "../encryption/ecdh";

const sendFile = (chatId: number, key: CryptoKey): Promise<{ type: "image" | "video", url: string, assetId: string }> => {
    return new Promise((resolve, reject) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*, video/*";

        input.addEventListener("change", async () => {
            const file = input.files?.item(0)
            if (file == null) {
                return reject("No file selected");
            }

            if (file.size > 100 * 1_000_000) {
                return reject("File too large")
            }

            const encrypted = await encryptFile(file, key);
            const packed = await packEncryptedFile(encrypted);

            console.log("Encrypted and packed: ", packed);
            let type: "" | "image" | "video" = "";
            if (file.type.includes("image")) {
                type = "image"
            }

            if (file.type.includes("video")) {
                type = "video"
            }

            if (type === "") {
                return reject("Invalid type")
            }

            console.log("Mimetype: ", type, file.type)

            // TODO: send file to server

            resolve({
                url: URL.createObjectURL(file),
                type: type,
                assetId: ""
            });
        })

        input.click();
    });
}

export default sendFile