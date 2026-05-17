import getUsernameById from "../../lib/auth/getUsernameById";
import { decryptMsg } from "../../lib/encryption/ecdh";
import type { EncryptedMessage } from "../../types/EncryptedMessage";
import type { Message } from "../../types/Message";
import api from "../apiservice";
import { getGroupDecryptKey, getMessageDecryptionKey } from "../keyservice";
import type ChatService from "./chatservice";

const historyHandler = (cs: ChatService, chatID: number): Promise<Message[]> => {
    return new Promise(async (resolve, reject) => {
        // get decryption key

        // get messages
        api.get(`/chat/${chatID}/messages`).then(async (response) => {
            const messages: EncryptedMessage[] = response.data.messages;
            let decrypted: Message[] = [];
            let dkey: CryptoKey | undefined;

            // helper function for pushing decrypted text messages to decrypted array
            const pushTextMessage = async (msg: EncryptedMessage, dMesssage: string) => {
                if (dkey == undefined) {
                    console.error("dKey is undefined")
                    return;
                }

                decrypted.push({
                    chatID: chatID,
                    date: new Date(msg.date),
                    message: dMesssage,
                    senderID: msg.senderID,
                    type: msg.type,
                    senderName: await getUsernameById(msg.senderID)
                })
            }

            // helper function for pushing file messages to decrypted array
            const pushFileMessage = async (msg: EncryptedMessage) => {
                if (dkey == undefined) {
                    console.error("dKey is undefined")
                    return;
                }
                const assetId = JSON.parse(msg.payload).assetId;
                decrypted.push({
                    chatID: msg.chatID,
                    date: new Date(msg.date),
                    message: undefined,
                    toLoad: assetId,
                    senderID: msg.senderID,
                    type: msg.type,
                    dKey: dkey,
                    senderName: await getUsernameById(msg.senderID)
                })
            }

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

                    if (!cs.privKey) {
                        console.error("No privkey");
                        return;
                    }

                    dkey = await getGroupDecryptKey(chatID, msg.kGuid, cs.privKey);
                    if (msg.type == "text") {
                        await pushTextMessage(msg, await decryptMsg(JSON.parse(msg.payload), dkey));

                        resolve();
                    } else {
                        // handle file messages
                        await pushFileMessage(msg);
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

                    if (!cs.masterKey) {
                        return reject("Failed to process message: masterKey not loaded")
                    }
                    dkey = await getMessageDecryptionKey(msg.senderKeyId, msg.recipientKeyId, msg.senderID, cs.masterKey);
                    // handle text messages
                    if (msg.type == "text") {
                        decryptMsg(JSON.parse(msg.payload), dkey).then(async (message) => {
                            await pushTextMessage(msg, message);
                            resolve();
                        }).catch((err) => {
                            console.error("Failed to decrypt message: ", err)
                            console.error("MSGINFO-H: ", msg.payload, chatID, msg.senderID);
                            reject(err)
                        })
                    } else {
                        // handle file messages
                        await pushFileMessage(msg);
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

export default historyHandler;