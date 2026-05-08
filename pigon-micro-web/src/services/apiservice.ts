import axios from "axios";
import { BASEURL } from "../conf";
import getAccessToken from "../lib/auth/getAccessToken";

const api = axios.create({
    baseURL: BASEURL,
    headers: { "Content-Type": "application/json" }
})

api.interceptors.response.use((res) => res, (error) => {
    console.log("401 watcher: ", error)
    let res = error.response;
    if (res) {
        if (res.status == 401) {
            const path = window.location.pathname;
            if (path !== "/login" && path !== "/unlock" && path !== "/setup") {
                location.replace("/login");
            }
            return Promise.reject(error);
        }
    }

    return Promise.reject(error);
})

api.interceptors.request.use(async (req) => {
    try {
        const token = await getAccessToken();
        req.headers.Authorization = `Bearer ${token}`
    } catch (error) {
        console.log("No access token, skipping interceptor")
    }

    return req;
})

export default api;