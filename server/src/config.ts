import { config } from "dotenv";
config();

const serverConfig = {
    PORT: process.env.PORT? parseInt(process.env.PORT): 8080,
    DB_DATABASE: process.env.DB_DATABASE,
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASS: process.env.DB_PASS,
    REGISTER_ENABLED: (process.env.REGISTER_ENABLED == "true"),
    REFRESH_EXPIRE: 128, // hours
    ACCESS_EXPIRE: 5 // minutes
}

export default serverConfig;