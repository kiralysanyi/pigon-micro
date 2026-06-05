import axios from "axios";
import { BASEURL } from "../../conf";

const getRefreshToken = async (): Promise<string> => {
    let rtoken = localStorage.getItem("rtoken");
    let rtokenExpire = localStorage.getItem("rtokenExpire");
    if (rtoken == null || rtokenExpire == null) {
        console.error("No refresh token found");
        throw new Error();
    }

    const expireDate = new Date(rtokenExpire);
    const expired = new Date() > expireDate;
    const diffMs = Math.abs(expireDate.getTime() - new Date().getTime());
    const diffHours = diffMs / (1000 * 60 * 60);
    const nearExpire = diffHours < 24;

    if (expired) {
        throw new Error("EXPIRED");
    }

    if (nearExpire) {
        try {
            const response = await axios.get(BASEURL + "/auth/refreshtoken", { headers: { Authorization: `Bearer ${rtoken}` } });
            if (response.status !== 200) {
                throw new Error("NET_ERROR");
            }

            localStorage.setItem("rtoken", response.data.refreshToken);
            localStorage.setItem("rtokenExpire", response.data.refreshTokenExpire);
            return response.data.refreshToken;
        } catch (error) {
            throw error;
        }
    }

    return rtoken;
}

export default getRefreshToken;