import { getSocket } from "../socket"

// Returns: accepted (bool)
const ringUser = (userId: number): Promise<{ accepted: boolean, socketId: string }> => {
    return new Promise<{ accepted: boolean, socketId: string }>(async (resolve) => {
        // send ring signal
        const socket = await getSocket();
        // should return true or false indicating accept state
        socket.once("ring-response", (response: { accepted: boolean, socketId: string }) => {
            resolve(response);
        })
        socket.emit("ring", userId);
    })
}

export default ringUser