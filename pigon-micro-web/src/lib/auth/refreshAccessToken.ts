import axios from "axios";
import { BASEURL } from "../../conf";
import getRefreshToken from "./getRefreshToken";

const refreshAccessToken = (): Promise<{ token: string, tokenExpire: string }> => {
    return new Promise(async (resolved, rejected) => {
        const rtoken = await getRefreshToken();
        axios.get(BASEURL + "/api/v1/auth/token", { headers: { Authorization: `Bearer ${rtoken}` } }).then((response) => {
            console.log(response.statusText);
            if (response.status !== 200) {
                rejected();
            }
            const token = response.data.token;
            const tokenExpire = response.data.tokenExpire;
            console.log(token, tokenExpire)
            resolved({
                token,
                tokenExpire
            })
        })
    })
}

export default refreshAccessToken;