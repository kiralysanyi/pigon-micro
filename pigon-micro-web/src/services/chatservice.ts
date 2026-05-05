import type { Socket } from "socket.io-client";
import { getSocket } from "../lib/socket";
import { getGroupDecryptKey, getGroupEncryptKey, getMessageDecryptionKey, getNewMessageEncryptionKey } from "./keyservice";
import { encryptMsg, decryptMsg, decryptFile } from "../lib/encryption/ecdh";
import type { Message } from "../types/Message";
import type { EncryptedMessage } from "../types/EncryptedMessage";
import getUsernameById from "../lib/auth/getUsernameById";
import getUserInfo from "../lib/auth/getUserInfo";
import uploadChatKeyPair from "../lib/chat/uploadChatKeyPair";
import api from "./apiservice";
import sendFile from "../lib/chat/sendFile";

interface ChatServiceEventMap {
    "message": CustomEvent<{ message: string; chatID: number; senderID: number, senderName: string, type: "text" | "image" | "video" | "file" }>;
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
    privKey: CryptoKey | undefined;

    private messageHandler = async ({ payload, chatID, senderId, senderKeyId, recipientKeyId, kGuid, type }: { payload: string, chatID: number, senderId: number, senderKeyId: number | undefined, recipientKeyId: number | undefined, kGuid: string | undefined, type: "text" | "image" | "video" | "file" }) => {
        if (!this.masterKey) {
            console.warn("Message handling aborted: masterKey not loaded")
            return;
        }

        const startTime = new Date();
        let dKey: CryptoKey | undefined;

        if (this.privKey == undefined) {
            console.error("No privkey loaded");
            return;
        }

        if (senderKeyId == undefined || recipientKeyId == undefined) {
            if (kGuid) {
                dKey = await getGroupDecryptKey(chatID, kGuid, this.privKey);
            } else {
                console.error("Invalid message", senderKeyId, recipientKeyId, kGuid);
                return;
            }
        }


        if (senderKeyId != undefined && recipientKeyId != undefined) {
            dKey = await getMessageDecryptionKey(senderKeyId, recipientKeyId, senderId, this.masterKey);
        }

        if (dKey == undefined) {
            console.error("dKey is undefined")
            return;
        }
        console.log(type)
        if (type == "text") {
            decryptMsg(JSON.parse(payload), dKey).then(async (message) => {
                this.dispatchEvent(new CustomEvent("message", {
                    detail: { message: message, chatID, senderId, senderName: await getUsernameById(senderId), type: "text" }
                }))

                console.log("Message processing took: ", `${new Date().getTime() - startTime.getTime()}ms`)

            }).catch((err) => {
                console.error("Failed to decrypt message: ", err)
                console.error("MSGINFO: ", payload, chatID, senderId)
            })
        } else {

            this.dispatchEvent(new CustomEvent("message", {
                detail: { message: JSON.parse(payload).assetId, chatID, senderId, senderName: await getUsernameById(senderId), type: "text" }
            }))
        }
    }

    // send message handler for group chats
    private sendGroupMessage = async (message: string, chatID: number) => {
        if (!this.privKey) {
            console.error("privKey not loaded");
            return;
        }
        const { key, kGuid } = await getGroupEncryptKey(chatID, this.privKey);

        const encrypted = await encryptMsg(message, key);

        this.socket?.emit("message", { payload: JSON.stringify(encrypted), chatID, kGuid, type: "text" })
    }

    sendMessage = async (message: string, chatID: number) => {
        const startTime = new Date();
        api.get("/chat/" + chatID).then(async (response) => {
            if (this.masterKey == undefined) {
                console.error("Chatservice not inited properly");
                return;
            }

            const chat = response.data.chat;
            console.log(chat)
            if (chat.type == "group") {
                await this.sendGroupMessage(message, chatID)
                return;
            }

            const participants = response.data.chat.participants as any[];
            const userInfo = await getUserInfo();
            const recipientID = participants.filter((p) => p.id != userInfo.ID)[0].id

            const sharedKey = await getNewMessageEncryptionKey(recipientID, this.masterKey)

            let encrypted = await encryptMsg(message, sharedKey.key)
            // todo: add ack
            console.log("Sending message: ", encrypted, chatID, this.socket)
            this.socket?.emit("message", { payload: JSON.stringify(encrypted), chatID, senderKeyId: sharedKey.senderKeyId, recipientKeyId: sharedKey.recipientKeyId, type: "text" })
            console.log("Message sending took: ", `${new Date().getTime() - startTime.getTime()}ms`)
        })
    }

    sendFile = async (chatID: number): Promise<{ type: "image" | "video", url: string }> => {
        return new Promise((resolve, reject) => {
            api.get("/chat/" + chatID).then(async (response) => {
                if (this.masterKey == undefined) {
                    console.error("Chatservice not inited properly");
                    return;
                }

                if (!this.privKey) {
                    console.error("privKey not loaded");
                    return;
                }

                const chat = response.data.chat;
                console.log(chat);
                if (chat.type == "group") {
                    const { key, kGuid } = await getGroupEncryptKey(chatID, this.privKey);
                    try {
                        const data = await sendFile(chatID, key);
                        console.log("File uploaded: ", data)
                        this.socket?.emit("message", { payload: { assetId: data.assetId }, chatID, kGuid, type: data.type })
                        console.log("Control message sent")
                        resolve(data)
                    } catch (error) {
                        reject(error);
                    }

                    return;
                }

                const participants = response.data.chat.participants as any[];
                const userInfo = await getUserInfo();
                const recipientID = participants.filter((p) => p.id != userInfo.ID)[0].id

                const sharedKey = await getNewMessageEncryptionKey(recipientID, this.masterKey)

                // sendFile function handles upload
                try {
                    const data = await sendFile(chatID, sharedKey.key);
                    console.log("File uploaded: ", data)
                    this.socket?.emit("message", { payload: { assetId: data.assetId }, chatID, senderKeyId: sharedKey.senderKeyId, recipientKeyId: sharedKey.recipientKeyId, type: data.type })
                    console.log("Control message sent")
                    resolve(data)
                } catch (error) {
                    reject(error);
                }
            })
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
            api.get(`/chat/${chatID}/messages`).then(async (response) => {
                const messages: EncryptedMessage[] = response.data.messages;
                let decrypted: Message[] = []

                // decrypt handler

                // group message handler
                const handleGroupMessage = (msg: EncryptedMessage): Promise<void> => {
                    return new Promise(async (resolve, reject) => {
                        if (!msg.kGuid) {
                            // not a group message;
                            console.error("Not a group message: ", msg)
                            reject("Err: not a group message")
                            return;
                        }

                        if (!this.privKey) {
                            console.error("No privkey");
                            return;
                        }

                        const dkey = await getGroupDecryptKey(chatID, msg.kGuid, this.privKey);
                        if (msg.type == "text") {
                            decrypted.push({
                                chatID: chatID,
                                date: new Date(msg.date),
                                message: await decryptMsg(JSON.parse(msg.payload), dkey),
                                senderID: msg.senderID,
                                type: msg.type,
                                senderName: await getUsernameById(msg.senderID)
                            })

                            resolve();
                        } else {
                            // handle file messages
                            const assetId = JSON.parse(msg.payload).assetId;

                            const response = await api.get(`/cdn/${assetId}`, { responseType: "arraybuffer" });

                            const decryptedFile: File = await decryptFile(response.data, dkey, msg.type);
                            const bUrl: string = URL.createObjectURL(decryptedFile);
                            decrypted.push({
                                chatID: msg.chatID,
                                date: new Date(msg.date),
                                message: bUrl,
                                senderID: msg.senderID,
                                type: msg.type,
                                senderName: await getUsernameById(msg.senderID)
                            })
                            resolve();
                        }

                    })
                }

                // private chat message handler
                const decryptMessage = (msg: EncryptedMessage): Promise<void> => {
                    return new Promise(async (resolve, reject) => {
                        if (!msg.senderKeyId || !msg.recipientKeyId) {
                            if (msg.kGuid) {
                                // group message
                                await handleGroupMessage(msg);
                                resolve();
                                return;
                            }
                            console.log("Invalid message data: ", msg)
                            return;
                        }

                        if (!this.masterKey) {
                            return reject("Failed to process message: masterKey not loaded")
                        }
                        const dkey = await getMessageDecryptionKey(msg.senderKeyId, msg.recipientKeyId, msg.senderID, this.masterKey);
                        // handle text messages
                        if (msg.type == "text") {
                            decryptMsg(JSON.parse(msg.payload), dkey).then(async (message) => {
                                decrypted.push({
                                    chatID: msg.chatID,
                                    date: new Date(msg.date),
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
                        } else {
                            // handle file messages
                            const assetId = JSON.parse(msg.payload).assetId;

                            const response = await api.get(`/cdn/${assetId}`, { responseType: "arraybuffer" });

                            const decryptedFile: File = await decryptFile(response.data, dkey, msg.type);
                            const bUrl: string = URL.createObjectURL(decryptedFile);
                            decrypted.push({
                                chatID: msg.chatID,
                                date: new Date(msg.date),
                                message: bUrl,
                                senderID: msg.senderID,
                                type: msg.type,
                                senderName: await getUsernameById(msg.senderID)
                            })
                            resolve();
                        }
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
    }

    init = (masterKey: CryptoKey, privKey: CryptoKey) => {
        console.log("Chatservice init: ", masterKey)
        this.masterKey = masterKey;
        this.privKey = privKey;
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