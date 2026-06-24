import getUsernameById from "../../lib/auth/getUsernameById";
import { decryptMsg } from "../../lib/encryption/ecdh";
import type { EncryptedMessage } from "../../types/EncryptedMessage";
import type { Message } from "../../types/Message";
import api from "../apiservice";
import { getGroupDecryptKey, getMessageDecryptionKey } from "../keyservice";
import type ChatService from "./chatservice";

const historyHandler = async (cs: ChatService, chatID: number, page: number): Promise<Message[]> => {
    // get decryption key

    // get messages
    const response = await api.get(`/chat/${chatID}/messages?page=${page}`);
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
            ID: msg.messageID,
            chatID: chatID,
            date: new Date(msg.date),
            message: dMesssage,
            senderID: msg.senderID,
            type: msg.type,
            senderName: await getUsernameById(msg.senderID),
            status: "ok"
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
            ID: msg.messageID,
            chatID: msg.chatID,
            date: new Date(msg.date),
            message: undefined,
            toLoad: assetId,
            senderID: msg.senderID,
            type: msg.type,
            dKey: dkey,
            senderName: await getUsernameById(msg.senderID),
            status: "ok"
        })
    }

    // decrypt handler

    // group message handler
    const handleGroupMessage = async (msg: EncryptedMessage): Promise<void> => {
        if (!msg.kGuid) {
            // not a group message;
            console.error("Not a group message: ", msg)
            throw new Error("Err: not a group message");
        }

        if (!cs.privKey) {
            console.error("No privkey");
            return;
        }

        dkey = await getGroupDecryptKey(chatID, msg.kGuid, cs.privKey);
        if (msg.type == "text") {
            await pushTextMessage(msg, await decryptMsg(JSON.parse(msg.payload), dkey));
        } else {
            // handle file messages
            await pushFileMessage(msg);
        }
    }

    // private chat message handler
    const decryptMessage = async (msg: EncryptedMessage): Promise<void> => {
        if (!msg.senderKeyId || !msg.recipientKeyId) {
            if (msg.kGuid) {
                // group message
                await handleGroupMessage(msg);
                return;
            }
            console.log("Invalid message data: ", msg)
            return;
        }

        if (!cs.masterKey) {
            throw new Error("Failed to process message: masterKey not loaded")
        }
        dkey = await getMessageDecryptionKey(msg.senderKeyId, msg.recipientKeyId, msg.senderID, cs.masterKey);
        // handle text messages
        if (msg.type == "text") {
            const message = await decryptMsg(JSON.parse(msg.payload), dkey);
            await pushTextMessage(msg, message);
        } else {
            // handle file messages
            await pushFileMessage(msg);
        }
    }

    // decrypt messages
    const startTime = new Date().getTime();
    for (let i in messages) {
        await decryptMessage(messages[i]);
    }

    const endTime = new Date().getTime();

    console.log("Message history decryption took: ", `${endTime - startTime}ms`)

    return decrypted;
}

export default historyHandler;