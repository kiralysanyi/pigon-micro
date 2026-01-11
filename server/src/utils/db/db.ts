import { createPool, RowDataPacket } from "mysql2";
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
    queueLimit: 0
})

const exists = (table: string, column: string, value: string | number): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        pool.query<RowDataPacket[]>(`SELECT 1 FROM ${table} WHERE ${column} = ?`, [value], (err, result) => {
            if (err) {
                console.error("SQL error: ", err)
                return reject(err);
            }

            console.log(result);
            if (result.length > 0) {
                resolve(true)
            } else {
                resolve(false)
            }
        })
    })
}

export { pool, exists };