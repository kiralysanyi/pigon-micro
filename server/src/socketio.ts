import { Server } from "http";
import * as SocketIO from "socket.io"

const attachSocketio = (server: Server) => {
    const io = new SocketIO.Server(server)
    io.on('connection', () => {

    });
}

export default attachSocketio;