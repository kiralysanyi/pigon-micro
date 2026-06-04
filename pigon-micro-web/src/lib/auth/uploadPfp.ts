import api from "../../services/apiservice";

const uploadPfp = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/png,image/jpeg,image/jpg,image/webp,image/gif";

        input.addEventListener("cancel", () => {
            console.log("No file selected")
            input.removeEventListener("change", handleChange);
            input.remove();
            return reject("No file selected");
        })

        const handleChange = async () => {
            const file = input.files?.item(0);
            if (!file) {
                resolve();
                return;
            }

            const formdata = new FormData();
            console.log(file.type)
            if (!input.accept.includes(file.type)) {
                reject(`File type not supported: ${file.type}`);
                return;
            }
            formdata.append("image", file);
            input.removeEventListener("change", handleChange);
            input.remove();

            try {
                await api.postForm("/auth/pfp", formdata);
                resolve();
            } catch (error: any) {
                console.error("PFP upload error: ", error);
                // Only show alert for 413 (payload too large)
                if (error.response && error.response.status === 413) {
                    reject(error.response.data?.message || "File too large")
                }
                if (error.response.status) {
                    reject(error.response.status);
                } else {
                    reject("Unknown error")
                }

            }
        };

        input.addEventListener("change", handleChange);
        input.click();
    });
};

export default uploadPfp;