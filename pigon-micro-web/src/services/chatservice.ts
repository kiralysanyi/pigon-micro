import type { Socket } from "socket.io-client";
import { getSocket } from "../lib/socket";
import { getSharedKey } from "./keyservice";
import { decrypt, encrypt } from "../lib/encryption/ecdh";
import { decodeEncryptedData, encodeEncryptedData } from "../lib/encryption/utils";
import axios from "axios";
import { BASEURL } from "../conf";
import getAccessToken from "../lib/auth/getAccessToken";
import type { Message } from "../types/Message";
import type { EncryptedMessage } from "../types/EncryptedMessage";
import getUsernameById from "../lib/auth/getUsernameById";

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

    private messageHandler = async (payload: string, chatID: number, senderID: number) => {
        const dKey = await getSharedKey(chatID);
        console.log("Shared key (decrypt): ", dKey)

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

    // get messages from server and decrypt
    getMessageHistory = (chatID: number): Promise<Message[]> => {
        return new Promise(async (resolve, reject) => {
            // get decryption key
            const dKey = await getSharedKey(chatID);

            // get messages
            getAccessToken().then((token) => {
                axios.get(`${BASEURL}/api/v1/chat/${chatID}/messages`, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }).then(async (response) => {
                    const messages: EncryptedMessage[] = response.data.messages;
                    let decrypted: Message[] = []

                    // decrypt handler
                    const decryptMessage = (msg: EncryptedMessage): Promise<void> => {
                        return new Promise((resolve, reject) => {
                            decrypt(decodeEncryptedData(msg.payload), dKey).then(async (message) => {
                                decrypted.push({
                                    chatID: msg.chatID,
                                    date: msg.date,
                                    message: message,
                                    senderID: msg.senderID,
                                    type: msg.type,
                                    senderName: await getUsernameById(msg.senderID)
                                })
                                resolve();
                            }).catch((err) => {
                                console.error("Failed to decrypt message: ", err)
                                console.error("MSGINFO-H: ", msg.payload, chatID, msg.senderID);
                                reject(err)
                            })
                        })

                    }

                    // decrypt messages
                    for (let i in messages) {
                        await decryptMessage(messages[i])
                    }

                    resolve(decrypted);
                }).catch((err) => {
                    console.error("Failed to fetch messages: ", err)
                    reject(err);
                })
            })
        })
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