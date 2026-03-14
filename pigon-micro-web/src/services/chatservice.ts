import type { Socket } from "socket.io-client";
import { getSocket } from "../lib/socket";
import { getSharedKey } from "./keyservice";
import { decrypt, encrypt } from "../lib/encryption/ecdh";
import { decodeEncryptedData, encodeEncryptedData } from "../lib/encryption/utils";

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

    private async messageHandler(payload: string, chatID: number, senderID: number) {
        const dKey = await getSharedKey(chatID);

        decrypt(decodeEncryptedData(payload), dKey).then((message) => {
            this.dispatchEvent(new CustomEvent("message", {
                detail: { message: message, chatID, senderID }
            }))
        }).catch((err) => {
            console.error("Failed to decrypt message: ", err)
            console.error("MSGINFO: ", payload, chatID, senderID)
        })
    }

    async sendMessage(message: string, chatID: number) {
        const sharedKey = await getSharedKey(chatID)
        let encrypted = await encrypt(message, sharedKey)
        // todo: add ack
        this.socket?.emit("message", { payload: encodeEncryptedData(encrypted), chatID })
    }

    unload() {
        this.socket?.off("message", this.messageHandler)
    }

    init() {
        getSocket()
            .then((sock) => {
                this.socket = sock;

                // attach event listeners
                sock.on("message", this.messageHandler)


            })
            .catch((err) => {
                console.error("Failed to get socket: ", err);
            });
    }
}

export default ChatService;