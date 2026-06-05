import { getSocket } from "../socket"

// Returns: accepted (bool)
const ringUser = (userId: number, chatId: number): Promise<{ accepted: boolean, socketId: string, reason: string }> => {
    return new Promise<{ accepted: boolean, socketId: string, reason: string }>(async (resolve) => {
        // send ring signal
        const socket = await getSocket();
        // should return true or false indicating accept state
        // TODO: remove this event listener if the user leaves the call before the other participant picks it up
        socket.once("ring-response", (response: { accepted: boolean, socketId: string, reason?: string }) => {
            resolve({ accepted: response.accepted, socketId: response.socketId, reason: response.reason ? response.reason : "declined" });
        })
        socket.emit("ring", userId, chatId);
    })
}

export default ringUser