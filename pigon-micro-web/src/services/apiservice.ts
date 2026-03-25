import axios from "axios";
import { BASEURL } from "../conf";
import getAccessToken from "../lib/auth/getAccessToken";

const api = axios.create({
    baseURL: BASEURL,
    headers: { "Content-Type": "application/json" }
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