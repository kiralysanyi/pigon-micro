import api from "../../services/apiservice";
import { clearUserInfoCache } from "./getUserInfo";

const logout = async (): Promise<void> => {
    try {
        await api.post("/auth/logout", {});
        sessionStorage.clear();
        localStorage.clear();
        clearUserInfoCache();
    } catch (err) {
        console.error("Failed to log out: ", err);
        throw err;
    }
}

export default logout;