import { createContext, useCallback, useRef, useState } from "react"
import { getSocket } from "../../lib/socket";

interface CallserviceContextData {
    inCall: boolean,
    callState?: "ringing" | "connected" | "connecting",
    setCallState?: React.Dispatch<React.SetStateAction<"connected" | "connecting" | "ringing" | undefined>>
    chatId?: number, // chat id of the call
    startTime?: Date, // start of the call
    audioRef?: React.RefObject<HTMLAudioElement | null>, // optionally expose the ref if we would need to interact with it, for example: changing volume
    setCall?: (chatId: number) => void, // set states so other pages can display an in call message
    endCall?: () => void, // clear out all states
    localVideoStream?: MediaStream,
    localAudioStream?: MediaStream,
    setStream?: (type: "audio" | "video", stream: MediaStream | undefined) => void,
    pc?: RTCPeerConnection,
    setPc?: React.Dispatch<React.SetStateAction<RTCPeerConnection | undefined>>,
    emitOffer?: (remoteSocketId: string) => Promise<void>,
    answerOffer?: (offer: RTCSessionDescriptionInit, remoteSocketId: string) => Promise<void>,
    remoteVideo?: MediaStream,
    remoteAudio?: MediaStream
    attachSignaling?: (remoteSocketId: string, isCaller: boolean) => Promise<void>
}

const CallServiceContext = createContext<CallserviceContextData>({
    inCall: false
});

const CallServiceProvider = ({ children }: React.PropsWithChildren) => {
    const [inCall, setInCall] = useState(false);
    const [chatId, setChatId] = useState<number>();
    const [startTime, setStartTime] = useState<Date>();
    const [pc, setPc] = useState<RTCPeerConnection | undefined>(undefined);
    const [remoteAudio, setRemoteAudio] = useState<MediaStream | undefined>();
    const [remoteVideo, setRemoteVideo] = useState<MediaStream | undefined>();

    const setCall = (chatId: number) => {
        setInCall(true);
        setChatId(chatId);
        setStartTime(new Date());
    }

    const setAudio = (stream: MediaStream | null) => {
        if (audioRef.current) {
            audioRef.current.srcObject = stream;
        } else {
            console.error("Audioref not initialized")
        }
    }

    const [attached, setAttached] = useState(false);

    const emitOffer = async (remoteSocketId: string) => {
        const socket = await getSocket();
        if (pc) {
            const offer = await pc.createOffer();
            pc.setLocalDescription(offer);
            const handleRelay = async ({ from, payload }: any) => {
                if (from != remoteSocketId) {
                    console.error("Ignored data from", from)
                    return;
                }

                if (payload.type == "answer") {
                    console.log("Got answer: ", payload.sdp)
                    await pc.setRemoteDescription(payload.sdp)
                    socket.off("relay", handleRelay)
                }
            }

            socket.on("relay", handleRelay)
            console.log("Emit offer: ", offer)
            socket.emit("relay", remoteSocketId, { type: "offer", sdp: offer })
        } else {
            console.error("PC not initialized")
        }
    }

    const attachSignaling = async (remoteSocketId: string, isCaller: boolean) => {
        if (attached == true) {
            console.log("Signaling already attached")
            return
        }
        const socket = await getSocket();
        if (pc != undefined) {
            pc.addEventListener("connectionstatechange", () => {
                console.warn("Peer connection state: ", pc.connectionState)
                if (pc.connectionState == "connected") {
                    setCallState("connected")
                }

                if (pc.connectionState == "connecting") {
                    setCallState("connecting")
                }
            })

            pc.addEventListener("track", ({ track }) => {
                if (track.kind == "audio") {
                    let stream = new MediaStream([track]);
                    setAudio(stream);
                    setRemoteAudio(stream);
                    track.addEventListener("ended", () => {
                        setRemoteAudio(undefined)
                    })
                }

                if (track.kind == "video") {
                    setRemoteVideo(new MediaStream([track]))
                    track.addEventListener("ended", () => {
                        setRemoteVideo(undefined)
                    })
                }
            })

            pc.addEventListener("icecandidate", ({ candidate }) => {
                if (candidate) {
                    socket.emit("relay", remoteSocketId, { type: "candidate", candidate })
                }
            })

            if (isCaller) {
                pc.addEventListener("negotiationneeded", async () => {
                    await emitOffer(remoteSocketId);
                })
            }

            socket.on("relay", async ({ from, payload }: any) => {
                if (from !== remoteSocketId) return;
                if (payload.type === "candidate" && payload.candidate) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
                        console.log("Added ICE candidate from", from);
                    } catch (e) {
                        console.error("Failed to add ICE candidate:", e);
                    }
                }
            })

            console.log("Attached signaling")
            setAttached(true);
        }
    }

    const answerOffer = async (offer: RTCSessionDescriptionInit, remoteSocketId: string) => {
        const socket = await getSocket();
        if (pc) {
            await pc.setRemoteDescription(offer);
            const answer = await pc.createAnswer(offer);
            await pc.setLocalDescription(answer);
            console.log("Got offer: ", offer);
            console.log("Emit answer: ", answer)
            socket.emit("relay", remoteSocketId, { type: "answer", sdp: answer })
        } else {
            console.error("PC not initialized")
        }
    }
    const [localVideoStream, setLocalVideostream] = useState<MediaStream>();
    const [localAudioStream, setLocalAudioStream] = useState<MediaStream>();


    const endCall = useCallback(() => {
        console.log("Ending call ", localAudioStream, localVideoStream)
        localAudioStream?.getTracks().forEach((track) => track.stop());
        localVideoStream?.getTracks().forEach((track) => track.stop());
        setLocalAudioStream(undefined);
        setLocalVideostream(undefined);

        setInCall(false);
        setChatId(undefined);
        setStartTime(undefined);
        setCallState(undefined);
        pc?.close();
        setPc(undefined);
        setAttached(false);
        getSocket().then((socket) => {
            socket.off("relay")
        })
    }, [localAudioStream, localVideoStream])

    const [callState, setCallState] = useState<"ringing" | "connected" | "connecting" | undefined>(undefined);

    const audioRef = useRef<HTMLAudioElement>(null);

    const setStream = (type: "video" | "audio", stream: MediaStream | undefined) => {
        switch (type) {
            case "audio":
                setLocalAudioStream(stream);
                break;
            case "video":
                setLocalVideostream(stream);
                break;
            default:
                break;
        }
    }

    return <CallServiceContext value={{
        inCall: inCall,
        setCall,
        chatId,
        endCall,
        startTime,
        audioRef,
        callState,
        setCallState,
        localAudioStream,
        localVideoStream,
        setStream,
        pc,
        setPc,
        emitOffer,
        answerOffer,
        attachSignaling,
        remoteAudio,
        remoteVideo
    }}>
        <audio ref={audioRef} autoPlay></audio>
        {children}
    </CallServiceContext>
}

export type { CallserviceContextData }
export { CallServiceProvider, CallServiceContext }