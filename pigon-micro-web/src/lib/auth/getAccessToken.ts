import refreshAccessToken from "./refreshAccessToken";

let refreshPromise: Promise<string> | null = null;

const getAccessToken = async (): Promise<string> => {
    // check localStorage first, if valid return
    let atoken = localStorage.getItem("atoken");
    let atokenExpire = localStorage.getItem("atokenExpire");
    if (atoken && atokenExpire) {
        const expireDate = new Date(atokenExpire);
        const expired = new Date() > expireDate;
        const diffMs = Math.abs(expireDate.getTime() - new Date().getTime());
        const diffMinutes = diffMs / (1000 * 60);
        const nearExpire = diffMinutes < 2;
        if (!expired && !nearExpire) {
            return atoken;
        }
    }
    // need refresh
    if (!refreshPromise) {
        refreshPromise = refreshAccessToken().then(newToken => {
            localStorage.setItem("atoken", newToken.token);
            localStorage.setItem("atokenExpire", newToken.tokenExpire);
            return newToken.token;
        }).finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
};

export default getAccessToken;