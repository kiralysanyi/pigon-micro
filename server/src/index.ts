import express from "express"
import { createServer } from "http";
import attachSocketio from "./socketio";
import serverConfig from "./config";

const app = express();
const server = createServer(app);
attachSocketio(server);
server.listen(serverConfig.PORT);
console.log("Listening on port: ", serverConfig.PORT)