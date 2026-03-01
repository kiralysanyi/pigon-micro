import type { Socket } from "socket.io-client";
import { getSocket } from "../lib/socket";

interface ChatServiceEventMap {
    "message": CustomEvent<{ message: string; chatID: number; senderID: number }>;
}

class ChatService extends EventTarget {
    addEventListener<K extends keyof ChatServiceEventMap>(
        type: K,
        listener: (event: ChatServiceEventMap[K]) => void,
        options?: boolean | AddEventListenerOptions
    ): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions
    ): void;
    addEventListener(type: string, listener: any, options?: any): void {
        super.addEventListener(type, listener, options);
    }

    socket: Socket | undefined;

    private messageHandler(payload: string, chatID: number, senderID: number) {

    }

    sendMessage(message: string, chatID: number) {
        let encrypted = message;
        // todo: encrypt

        // todo: add ack
        this.socket?.emit("message", { payload: encrypted, chatID })
    }

    init() {
        getSocket()
            .then((sock) => {
                this.socket = sock;

                // attach event listeners
                sock.on("message", (payload: string, chatID: number, senderID: number) => {
                    this.messageHandler(payload, chatID, senderID);
                })


            })
            .catch((err) => {
                console.error("Failed to get socket: ", err);
            });
    }
}

export default ChatService;