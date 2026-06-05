import type { userdata } from "../../types/userdata";
import getUserInfo from "./getUserInfo"

const getUsernameById = async (userID: number): Promise<string> => {
    const saved = localStorage.getItem("usrcache" + userID);

    if (saved != null) {
        const parsed = JSON.parse(saved) as userdata;
        return parsed.username;
    }

    try {
        const data = await getUserInfo(userID);
        // cache to localstorage
        // TODO: move it to a more performant storage solution
        localStorage.setItem("usrcache" + userID, JSON.stringify(data));
        return data.username;
    } catch (err) {
        console.error("Failed to get username: ", userID, err);
        throw err;
    }
}

export default getUsernameById;