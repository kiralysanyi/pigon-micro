let BASEURL = "http://localhost:8080/api/v1";

if (import.meta.env.PROD) {
    BASEURL = "/api/v1";
}

export { BASEURL }