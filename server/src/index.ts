import express from "express"
import { createServer } from "http";
import attachSocketio from "./socketio";
import serverConfig from "./config";
import { apiRouter } from "./routes/router";
import cors from "cors"

const app = express();

app.use(cors({origin: "*"}))
app.use(express.json());
const server = createServer(app);
// attach socketio handler
attachSocketio(server);

// attach routers
app.use("/api/v1", apiRouter);

// listen
server.listen(serverConfig.PORT);
console.log("Listening on port: ", serverConfig.PORT)