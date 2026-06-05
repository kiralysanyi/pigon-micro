import axios from "axios";
import { BASEURL } from "../../conf";
import getRefreshToken from "./getRefreshToken";

const refreshAccessToken = async (): Promise<{ token: string, tokenExpire: string }> => {
    try {
        const rtoken = await getRefreshToken();
        const response = await axios.get(BASEURL + "/auth/token", { headers: { Authorization: `Bearer ${rtoken}` } });
        console.log(response.statusText);
        if (response.status !== 200) {
            throw new Error("Failed to refresh access token");
        }
        const token = response.data.token;
        const tokenExpire = response.data.tokenExpire;
        console.log(token, tokenExpire)
        return {
            token,
            tokenExpire
        };
    } catch (error) {
        console.error("Failed to refresh access token: ", error);
        throw error;
    }
}

export default refreshAccessToken;