import refreshAccessToken from "./refreshAccessToken";

// todo: fix expired token handling
let lock = false;

const getAccessToken = (): Promise<string> => {
    return new Promise(async (resolved, rejected) => {
        // actual logic for getting token
        const getToken = async () => {
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
                    lock = true;
                    const newToken = await refreshAccessToken();
                    atoken = newToken.token;
                    localStorage.setItem("atoken", newToken.token);
                    localStorage.setItem("atokenExpire", newToken.tokenExpire);
                    lock = false;
                    resolved(atoken);
                } catch (error) {
                    console.error("Failed to get new access token: ", error)
                    rejected();
                }
            } else {
                resolved(atoken)
            }
        }

        // if a token retrieval operation is in progress wait until its comlete
        if (lock == true) {
            const wait = () => {
                setTimeout(() => {
                    if (lock == true) {
                        console.warn("Access token retrieval locked")
                        return wait();
                    } else {
                        console.warn("Access token retrieval unlocked")
                        // no lock, return token
                        getToken();
                    }
                }, 200);
            }

            wait();

        } else {
            // no locking, return token
            getToken();
        }

    })
}

export default getAccessToken;