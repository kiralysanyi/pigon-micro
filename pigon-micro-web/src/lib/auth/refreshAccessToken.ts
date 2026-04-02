import axios from "axios";
import { BASEURL } from "../../conf";
import getRefreshToken from "./getRefreshToken";

const refreshAccessToken = (): Promise<{ token: string, tokenExpire: string }> => {
    return new Promise(async (resolved, rejected) => {
        try {
            const rtoken = await getRefreshToken();
            axios.get(BASEURL + "/auth/token", { headers: { Authorization: `Bearer ${rtoken}` } }).then((response) => {
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
            }).catch((err) => {
                console.error("Failed to refresh access token: ", err)
                rejected(err)
                throw err;
            })
        } catch (error) {
            console.error("Failed to refresh access token: ", error)
            rejected(error)
        }

    })
}

export default refreshAccessToken;