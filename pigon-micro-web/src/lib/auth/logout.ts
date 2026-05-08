import api from "../../services/apiservice";

const logout = (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        api.post("/auth/logout", {}).then(() => {
            sessionStorage.clear();
            localStorage.clear();
            // TODO: Clear keys from context and indexedDB
            resolve();
        }).catch((err) => {
            console.error("Failed to log out: ", err)
            reject(err)
        })
    })
}

export default logout;