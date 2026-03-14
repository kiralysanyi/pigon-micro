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

    private messageHandler = async(payload: string, chatID: number, senderID: number) => {
        const dKey = await getSharedKey(chatID);
        console.log("Shared key (decrypt): ",dKey)

        decrypt(decodeEncryptedData(payload), dKey).then((message) => {
            console.log("Decrypted: ", message)
            this.dispatchEvent(new CustomEvent("message", {
                detail: { message: message, chatID, senderID }
            }))
        }).catch((err) => {
            console.error("Failed to decrypt message: ", err)
            console.error("MSGINFO: ", payload, chatID, senderID)
        })
    }

    sendMessage = async (message: string, chatID: number) => {
        const sharedKey = await getSharedKey(chatID)
        let encrypted = await encrypt(message, sharedKey)
        console.log("Shared key: ", sharedKey)
        // todo: add ack
        console.log("Sending message: ", encrypted, chatID, this.socket)
        this.socket?.emit("message", { payload: encodeEncryptedData(encrypted), chatID })
    }

    unload = () => {
        this.socket?.off("message", this.messageHandler)
    }

    init = () => {
        console.log("Chatservice init")
        getSocket()
            .then((sock) => {
                console.log("Got socket")
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