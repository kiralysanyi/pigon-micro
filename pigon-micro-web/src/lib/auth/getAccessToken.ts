import refreshAccessToken from "./refreshAccessToken";

const getAccessToken = (): Promise<string> => {
    return new Promise(async (resolved, rejected) => {
        let atoken = localStorage.getItem("atoken");
        let atokenExpire = localStorage.getItem("atokenExpire");
        if (atoken == null || atokenExpire == null) {
            console.error("No access token found");
            rejected();
            return;
        }

        const expireDate = new Date(atokenExpire);
        const expired = new Date() > expireDate;
        const diffMs = Math.abs(expireDate.getTime() - new Date().getTime());
        const diffMinutes = diffMs / (1000 * 60);
        const nearExpire = diffMinutes < 2;

        if (expired || nearExpire) {
            try {
                const newToken = await refreshAccessToken();
                atoken = newToken.token;
                localStorage.setItem("atoken", newToken.token);
                localStorage.setItem("atokenExpire", newToken.tokenExpire);
                resolved(atoken);
            } catch (error) {
                console.error("Failed to get new access token: ", error)
                rejected();
            }
        } else {
            resolved(atoken)
        }
    })
}

export default getAccessToken;