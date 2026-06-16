import type { Socket } from "socket.io-client";
import { getSocket } from "../../lib/socket";
import type { Message } from "../../types/Message";
import uploadChatKeyPair from "../../lib/chat/uploadChatKeyPair";
import historyHandler from "./historyHandler";
import { handleMessageEvent, sendFileMessage, sendMessage } from "./messageHelper";
import getChatName from "../../lib/chat/getChatName";
import NotificationService from "../NotificationService";

// event map for chatservice, used for typing event listeners
interface ChatServiceEventMap {
    "message": CustomEvent<Message>;
}

// ChatService is responsible for handling all chat related functionality, including sending and receiving messages, key management, and message history retrieval.
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
    initialized: boolean = false;
    notifService = new NotificationService();

    // handler for incoming messages

    private messageHandler = async ({ payload, chatID, senderId, senderKeyId, recipientKeyId, kGuid, type }: { payload: string, chatID: number, senderId: number, senderKeyId: number | undefined, recipientKeyId: number | undefined, kGuid: string | undefined, type: "text" | "image" | "video" | "file" }) => {
        handleMessageEvent({ payload, chatID, senderId, senderKeyId, recipientKeyId, kGuid, type }, this);
        const chatname = await getChatName(chatID);
        this.notifService.sendNotif(chatname, `New message from: ${chatname}`)
    }

    // send message handler
    sendMessage = async (message: string, chatID: number) => {
        console.log("Send: ", message, chatID)
        await sendMessage(message, chatID, this);
        window.dispatchEvent(new CustomEvent("chat:msgsend", { detail: { chatId: chatID } }))
        return;
    }

    // send file handler, works for both group and private chats
    sendFile = async (chatID: number): Promise<{ type: "image" | "video", url: string }> => {
        return sendFileMessage(chatID, this);
    }

    rotateInterval?: number = undefined

    // key rotation function, checks if keys need to be rotated and rotates if necessary (should be called every minute or so)
    private rotateKeys = () => {
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

    // unload function to remove event listeners when chat page is closed
    unload = () => {
        clearInterval(this.rotateInterval)
        this.socket?.off("message", this.messageHandler)
    }

    // get messages from server and decrypt
    getMessageHistory = (chatID: number, page: number): Promise<Message[]> => {
        return historyHandler(this, chatID, page);
    }

    // init function to set masterKey and privKey, also initializes socket connection and event listeners
    init = (masterKey: CryptoKey, privKey: CryptoKey) => {
        if (this.initialized == true) {
            console.warn("ChatService already initialized, skipping init");
            return;
        }
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


        this.rotateInterval = setInterval(() => {
            this.rotateKeys();
        }, 2 * 60 * 1000);
        this.initialized = true;
    }
}

export default ChatService;