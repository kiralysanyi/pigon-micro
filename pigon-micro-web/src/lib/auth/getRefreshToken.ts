import axios from "axios";
import { BASEURL } from "../../conf";

const getRefreshToken = (): Promise<string> => {
    return new Promise(async (resolved, rejected) => {
        let rtoken = localStorage.getItem("rtoken");
        let rtokenExpire = localStorage.getItem("rtokenExpire");
        if (rtoken == null || rtokenExpire == null) {
            console.error("No refresh token found");
            rejected();
            return;
        }

        const expireDate = new Date(rtokenExpire);
        const expired = new Date() > expireDate;
        const diffMs = Math.abs(expireDate.getTime() - new Date().getTime());
        const diffHours = diffMs / (1000 * 60 * 60);
        const nearExpire = diffHours < 24;

        if (expired) {
            return rejected();
        }

        if (nearExpire) {
            const response = await axios.get(BASEURL + "/auth/refreshtoken", { headers: { Authorization: `Bearer ${rtoken}` } })
            if (response.status !== 200) {
                return rejected();
            }

            localStorage.setItem("rtoken", response.data.refreshToken);
            localStorage.setItem("rtokenExpire", response.data.refreshTokenExpire);
            return resolved(response.data.refreshToken);
        }

        resolved(rtoken)
    })
}

export default getRefreshToken;