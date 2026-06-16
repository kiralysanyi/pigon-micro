import express from "express"
import { createServer } from "http";
import attachSocketio from "./socketio";
import serverConfig from "./config";
import { apiRouter } from "./routes/router";
import cors from "cors"
import webuiHost from "./webuihost/webuiHost";
import knex from "knex";
import * as kConfig from "./knexfile";


(async () => {
    // Migrate db
    // TODO: change this
    const db = knex(kConfig.default.development)

    process.on('SIGINT', async () => {
        await db.destroy();
        process.exit(0);
    });

    try {
        console.log('Running database migrations...');
        await db.migrate.latest();
        console.log('Database schema is up to date.');
    } catch (error) {
        console.error("Failed to migrate: ", error);
        process.exit(1);
    }

    // Init main app

    const app = express();

    app.use(cors({ origin: "*" }))
    app.use(express.json());
    const server = createServer(app);
    // attach socketio handler
    attachSocketio(server);

    // attach routers
    app.use("/api/v1", apiRouter);

    // host webui if available
    webuiHost(app);

    // listen
    server.listen(serverConfig.PORT);
    console.log("Listening on port: ", serverConfig.PORT)
})();