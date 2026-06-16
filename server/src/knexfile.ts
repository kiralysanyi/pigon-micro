const { configDotenv } = require("dotenv");

configDotenv();

// knexfile.js
export default {
    development: {
        client: 'mysql2',
        connection: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_DATABASE,
            multipleStatements: true
        },
        migrations: {
            tableName: 'knex_migrations', // Tracks which migrations ran
            directory: './migrations',    // Where your migration files live
        },
    },
    production: {
        client: 'mysql2',
        connection: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_DATABASE,
            multipleStatements: true
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: './migrations',
        },
    },
};