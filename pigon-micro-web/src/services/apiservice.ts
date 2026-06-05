import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { BASEURL } from "../conf";
import getAccessToken from "../lib/auth/getAccessToken";

// Custom error types for better handling
export class AuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AuthError";
    }
}

const api = axios.create({
    baseURL: BASEURL,
    headers: { "Content-Type": "application/json" },
    // Optional: add timeout to prevent hanging requests
    timeout: 15000,
});

// Flag to prevent multiple simultaneous redirects
let isRedirecting = false;

// Request interceptor – attach token or fail early
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const token = await getAccessToken();
            config.headers.Authorization = `Bearer ${token}`;
            return config;
        } catch (error) {
            // Token retrieval failed (e.g., refresh token expired, no token stored)
            console.error("Failed to obtain access token:", error);
            // Abort the request by rejecting – avoid sending request without auth
            return Promise.reject(new AuthError("Unable to authenticate request"));
        }
    },
    (error) => Promise.reject(error)
);

// Response interceptor – handle 401, network errors, and other statuses
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const response = error.response;

        // Network / timeout / CORS errors
        if (!response) {
            console.error("Network or server unreachable:", error.message);
            // Optionally dispatch a global event for the UI to show a toast
            window.dispatchEvent(new CustomEvent("api:network-error", { detail: error }));
            return Promise.reject(error);
        }

        // Handle 401 Unauthorized
        if (response.status === 401) {
            // Prevent infinite redirect loops
            if (isRedirecting) {
                return Promise.reject(error);
            }

            // Avoid redirecting on auth-related pages
            const { pathname } = window.location;
            const publicPaths = ["/login", "/unlock", "/setup"];
            if (!publicPaths.includes(pathname)) {
                isRedirecting = true;
                // Optional: clear stale tokens
                localStorage.removeItem("atoken");
                localStorage.removeItem("atokenExpire");
                // Use React Router navigation if available, otherwise fallback to location.replace
                // For now, we use location.replace to avoid back-button issues
                location.replace("/login");
            }
            return Promise.reject(error);
        }

        // Handle 403 Forbidden – maybe user lacks permissions
        if (response.status === 403) {
            console.warn("Forbidden access – check user permissions");
            // You could fire a global event for the UI
            window.dispatchEvent(new CustomEvent("api:forbidden", { detail: error }));
        }

        // Handle 5xx server errors
        if (response.status >= 500) {
            console.error(`Server error ${response.status}:`, response.data);
            window.dispatchEvent(new CustomEvent("api:server-error", { detail: error }));
        }

        // All other errors – propagate
        return Promise.reject(error);
    }
);

export default api;