import api from "../../services/apiservice";

const uploadPfp = (): Promise<void> => {
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        input.addEventListener("change", async () => {
            const file = input.files?.item(0);
            console.log(input.files, file)

            if (!file) {
                return resolve();
            }

            const formdata = new FormData();
            formdata.append("image", file);
            try {
                await api.postForm("/auth/pfp", formdata)
                resolve();
            } catch (error: any) {
                console.error("PFP upload error: ", error);
                if (error.response) {
                    if (error.response.status == 413) {
                        window.alert(error.response.data.message)
                    }
                }
                resolve();
            }
        })

        input.click();
    })
}

export default uploadPfp;