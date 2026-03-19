import type { Socket } from "socket.io-client";
import { getSocket } from "../lib/socket";
import { getMessageDecryptionKey, getNewMessageEncryptionKey } from "./keyservice";
import { encryptMsg, decryptMsg } from "../lib/encryption/ecdh";
import axios from "axios";
import { BASEURL } from "../conf";
import getAccessToken from "../lib/auth/getAccessToken";
import type { Message } from "../types/Message";
import type { EncryptedMessage } from "../types/EncryptedMessage";
import getUsernameById from "../lib/auth/getUsernameById";
import getUserInfo from "../lib/auth/getUserInfo";
import uploadChatKeyPair from "../lib/chat/uploadChatKeyPair";

interface ChatServiceEventMap {
    "message": CustomEvent<{ message: string; chatID: number; senderID: number, senderName: string }>;
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
    masterKey: CryptoKey | undefined;

    private messageHandler = async (payload: string, chatID: number, senderID: number, senderKeyId: number, recipientKeyId: number) => {
        if (!this.masterKey) {
            console.warn("Message handling aborted: masterKey not loaded")
            return;
        }

        const startTime = new Date();


        const dKey = await getMessageDecryptionKey(senderKeyId, recipientKeyId, senderID, this.masterKey);


        decryptMsg(JSON.parse(payload), dKey).then(async (message) => {
            this.dispatchEvent(new CustomEvent("message", {
                detail: { message: message, chatID, senderID, senderName: await getUsernameById(senderID) }
            }))

            console.log("Message processing took: ", `${new Date().getTime() - startTime.getTime()}ms`)

        }).catch((err) => {
            console.error("Failed to decrypt message: ", err)
            console.error("MSGINFO: ", payload, chatID, senderID)
        })
    }

    // TODO: make this group chat compatible
    sendMessage = async (message: string, chatID: number) => {
        const startTime = new Date();
        axios.get(BASEURL + "/api/v1/chat/" + chatID, { headers: { Authorization: `Bearer ${await getAccessToken()}` } }).then(async (response) => {
            if (this.masterKey == undefined) {
                console.error("Chatservice not inited properly");
                return;
            }
            const participants = response.data.chat.participants as any[];
            const userInfo = await getUserInfo();
            const recipientID = participants.filter((p) => p.id != userInfo.ID)[0].id

            const sharedKey = await getNewMessageEncryptionKey(recipientID, this.masterKey)

            let encrypted = await encryptMsg(message, sharedKey.key)
            // todo: add ack
            console.log("Sending message: ", encrypted, chatID, this.socket)
            this.socket?.emit("message", { payload: JSON.stringify(encrypted), chatID, senderKeyId: sharedKey.senderKeyId, recipientKeyId: sharedKey.recipientKeyId })
            console.log("Message sending took: ", `${new Date().getTime() - startTime.getTime()}ms`)
        })
    }

    rotateKeys = () => {
        const rotate = () => {
            if (this.masterKey) {
                console.log("Key rotating")
                uploadChatKeyPair(this.masterKey);
                const nrd = new Date();
                nrd.setMinutes(nrd.getMinutes() + 10)
                localStorage.setItem("nextRotate", nrd.toISOString())
                return;
            }
        }

        const nextRotate = localStorage.getItem("nextRotate");
        if (nextRotate == null) {
            rotate();
        } else {
            const nr = new Date(nextRotate);
            if (nr < new Date()) {
                rotate();
            }
        }

    }

    unload = () => {
        this.socket?.off("message", this.messageHandler)
    }

    // get messages from server and decrypt
    getMessageHistory = (chatID: number): Promise<Message[]> => {
        return new Promise(async (resolve, reject) => {
            // get decryption key

            // get messages
            getAccessToken().then((token) => {
                axios.get(`${BASEURL}/api/v1/chat/${chatID}/messages`, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }).then(async (response) => {
                    const messages: EncryptedMessage[] = response.data.messages;
                    let decrypted: Message[] = []

                    // decrypt handler

                    const decryptMessage = (msg: EncryptedMessage): Promise<void> => {
                        return new Promise(async (resolve, reject) => {
                            if (!msg.senderKeyId || !msg.recipientKeyId) {
                                console.log("Invalid message data: ", msg)
                                return;
                            }

                            if (!this.masterKey) {
                                return reject("Failed to process message: masterKey not loaded")
                            }
                            const dkey = await getMessageDecryptionKey(msg.senderKeyId, msg.recipientKeyId, msg.senderID, this.masterKey);

                            // TODO: improve speed by throwing out this base64 bullshit
                            decryptMsg(JSON.parse(msg.payload), dkey).then(async (message) => {
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
                    const startTime = new Date().getTime();
                    for (let i in messages) {
                        await decryptMessage(messages[i])
                    }

                    const endTime = new Date().getTime();

                    console.log("Message history decryption took: ", `${endTime - startTime}ms`)

                    resolve(decrypted);
                }).catch((err) => {
                    console.error("Failed to fetch messages: ", err)
                    reject(err);
                })
            })
        })
    }

    init = (masterKey: CryptoKey) => {
        console.log("Chatservice init: ", masterKey)
        this.masterKey = masterKey;
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