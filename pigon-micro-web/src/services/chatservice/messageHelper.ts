import getUserInfo from "../../lib/auth/getUserInfo";
import getUsernameById from "../../lib/auth/getUsernameById";
import sendFile from "../../lib/chat/sendFile";
import { decryptMsg, encryptMsg } from "../../lib/encryption/ecdh";
import api from "../apiservice";
import { getGroupDecryptKey, getGroupEncryptKey, getMessageDecryptionKey, getNewMessageEncryptionKey } from "../keyservice";
import type ChatService from "./chatservice";

// function for handling incoming messages from socketio
const handleMessageEvent = async ({ payload, chatID, senderId, senderKeyId, recipientKeyId, kGuid, type }: { payload: string, chatID: number, senderId: number, senderKeyId: number | undefined, recipientKeyId: number | undefined, kGuid: string | undefined, type: "text" | "image" | "video" | "file" }, cs: ChatService) => {
    if (!cs.masterKey) {
        console.warn("Message handling aborted: masterKey not loaded")
        return;
    }

    const startTime = new Date();
    let dKey: CryptoKey | undefined;

    if (cs.privKey == undefined) {
        console.error("No privkey loaded");
        return;
    }

    // determine decryption key
    if (senderKeyId == undefined || recipientKeyId == undefined) {
        // group message, kGuid must be defined
        if (kGuid) {
            dKey = await getGroupDecryptKey(chatID, kGuid, cs.privKey);
        } else {
            console.error("Invalid message", senderKeyId, recipientKeyId, kGuid);
            return;
        }
    }

    // private message
    if (senderKeyId != undefined && recipientKeyId != undefined) {
        dKey = await getMessageDecryptionKey(senderKeyId, recipientKeyId, senderId, cs.masterKey);
    }

    if (dKey == undefined) {
        console.error("dKey is undefined")
        return;
    }
    console.log(type)
    // handle text messages
    if (type == "text") {
        decryptMsg(JSON.parse(payload), dKey).then(async (message) => {
            cs.dispatchEvent(new CustomEvent("message", {
                detail: { message: message, chatID, senderId, senderName: await getUsernameById(senderId), type: "text" }
            }))

            console.log("Message processing took: ", `${new Date().getTime() - startTime.getTime()}ms`)

        }).catch((err) => {
            console.error("Failed to decrypt message: ", err)
            console.error("MSGINFO: ", payload, chatID, senderId)
        })
    } else {
        // handle file messages
        const assetId = JSON.parse(payload).assetId;

        cs.dispatchEvent(new CustomEvent("message", {
            detail: { message: undefined, chatID, senderId, senderName: await getUsernameById(senderId), type: type, toLoad: assetId, dKey: dKey }
        }))
    }
}

// group message send handler, should not be exposed outside of cs file, since it does not handle private message sending and has different parameters than the sendMessage function that is exposed by ChatService
const sendGroupMessage = async (message: string, chatID: number, cs: ChatService) => {
    if (!cs.privKey) {
        console.error("privKey not loaded");
        return;
    }
    const { key, kGuid } = await getGroupEncryptKey(chatID, cs.privKey);

    const encrypted = await encryptMsg(message, key);

    cs.socket?.emit("message", { payload: JSON.stringify(encrypted), chatID, kGuid, type: "text" })
}

// message sending for private and group chats, file sending is handled in separate function
const sendMessage = async (message: string, chatID: number, cs: ChatService) => {
    const startTime = new Date();
    const response = await api.get("/chat/" + chatID)

    if (cs.masterKey == undefined) {
        console.error("Chatservice not inited properly");
        return;
    }

    const chat = response.data.chat;
    console.log(chat)
    if (chat.type == "group") {
        await sendGroupMessage(message, chatID, cs);
        return;
    }

    const participants = response.data.chat.participants as any[];
    const userInfo = await getUserInfo();
    const recipientID = participants.filter((p) => p.id != userInfo.ID)[0].id

    const sharedKey = await getNewMessageEncryptionKey(recipientID, cs.masterKey)

    let encrypted = await encryptMsg(message, sharedKey.key)
    // todo: add ack
    console.log("Sending message: ", encrypted, chatID, cs.socket)
    cs.socket?.emit("message", { payload: JSON.stringify(encrypted), chatID, senderKeyId: sharedKey.senderKeyId, recipientKeyId: sharedKey.recipientKeyId, type: "text" })
    console.log("Message sending took: ", `${new Date().getTime() - startTime.getTime()}ms`)
}

const sendFileMessage = async (chatID: number, cs: ChatService): Promise<{ type: "image" | "video", url: string }> => {
    return new Promise((resolve, reject) => {
        api.get("/chat/" + chatID).then(async (response) => {
            if (cs.masterKey == undefined) {
                console.error("Chatservice not inited properly");
                return;
            }

            if (!cs.privKey) {
                console.error("privKey not loaded");
                return;
            }

            const chat = response.data.chat;
            console.log(chat);
            if (chat.type == "group") {
                const { key, kGuid } = await getGroupEncryptKey(chatID, cs.privKey);
                try {
                    const data = await sendFile(chatID, key);
                    console.log("File uploaded: ", data)
                    cs.socket?.emit("message", { payload: { assetId: data.assetId }, chatID, kGuid, type: data.type })
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

            const sharedKey = await getNewMessageEncryptionKey(recipientID, cs.masterKey)

            // sendFile function handles upload
            try {
                const data = await sendFile(chatID, sharedKey.key);
                console.log("File uploaded: ", data)
                cs.socket?.emit("message", { payload: { assetId: data.assetId }, chatID, senderKeyId: sharedKey.senderKeyId, recipientKeyId: sharedKey.recipientKeyId, type: data.type })
                console.log("Control message sent")
                resolve(data)
            } catch (error) {
                reject(error);
            }
        })
    })
}

export { handleMessageEvent, sendMessage, sendFileMessage };