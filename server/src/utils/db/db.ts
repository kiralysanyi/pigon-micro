import { createPool, RowDataPacket } from "mysql2/promise";
import serverConfig from "../../config";

const pool = createPool({
    host: serverConfig.DB_HOST,
    user: serverConfig.DB_USER,
    password: serverConfig.DB_PASS,
    database: serverConfig.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    timezone: "Z"
})

const exists = async (table: string, column: string, value: string | number): Promise<boolean> => {
    try {
        const [result] = await pool.query<RowDataPacket[]>(`SELECT 1 FROM ${table} WHERE ${column} = ?`, [value]);
        if (result.length > 0) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        throw error;
    }
}

export { pool, exists };