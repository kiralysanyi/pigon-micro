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
    localScreenStream?: MediaStream,
    setStream?: (type: "audio" | "video" | "screen", stream: MediaStream | undefined) => void,
    pc?: RTCPeerConnection,
    setPc?: React.Dispatch<React.SetStateAction<RTCPeerConnection | undefined>>,
    emitOffer?: (remoteSocketId: string) => Promise<void>,
    answerOffer?: (offer: RTCSessionDescriptionInit, remoteSocketId: string) => Promise<void>,
    remoteVideo?: MediaStream,
    remoteAudio?: MediaStream,
    remoteScreen?: MediaStream,
    screenSendRef?: React.RefObject<RTCRtpSender | undefined>,
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
    const [localScreenStream, setLocalScreenStream] = useState<MediaStream | undefined>();
    const [remoteScreen, setRemoteScreen] = useState<MediaStream | undefined>();

    const screenSendRef = useRef<RTCRtpSender | undefined>(undefined);

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

    const attachSignaling = async (remoteSocketId: string, isCaller: boolean) => {
        if (attached == true) {
            console.log("Signaling already attached")
            return
        }
        const socket = await getSocket();
        let screenStreamId: string | null = null;
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

            pc.addEventListener("track", ({ track, streams }) => {
                if (track.kind == "audio") {
                    let stream = new MediaStream([track]);
                    setAudio(stream);
                    setRemoteAudio(stream);
                    track.addEventListener("ended", () => {
                        setRemoteAudio(undefined)
                    })
                }

                if (track.kind == "video") {
                    // Check if this video track is inside the signaled screen share stream container
                    if (streams[0] && streams[0].id === screenStreamId) {
                        console.log("Got screen share track cleanly via Stream ID!")
                        setRemoteScreen(new MediaStream([track]));
                        track.addEventListener("ended", () => {
                            console.log("Screen share ended!")
                            setRemoteScreen(undefined);
                        })
                        return;
                    }

                    // Fallback for camera track
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

            let makingOffer = false;

            pc.addEventListener("negotiationneeded", async () => {
                try {
                    if (pc.signalingState !== "stable") return;
                    makingOffer = true;

                    await pc.setLocalDescription();

                    socket.emit("relay", remoteSocketId, {
                        type: "offer",
                        sdp: pc.localDescription
                    });
                } catch (e) {
                    console.error("negotiationneeded error:", e);
                } finally {
                    makingOffer = false;
                }
            });

            socket.on("relay", async ({ from, payload }: any) => {
                if (from !== remoteSocketId) return;

                if (payload.type === "screen-start") {
                    console.log("Other participant started screen share")
                    screenStreamId = payload.streamId;
                    return;
                }
                if (payload.type === "screen-stop") {
                    console.log("Other participant stopped screen share")
                    screenStreamId = null;
                    setRemoteScreen(undefined);
                    return;
                }

                if (payload.type === "candidate" && payload.candidate) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
                        console.log("Added ICE candidate from", from);
                    } catch (e) {
                        console.error("Failed to add ICE candidate:", e);
                    }
                }

                try {
                    const isPolite = !isCaller; // Callee is polite, Caller is impolite
                    const offerCollision = payload.type === "offer" && (makingOffer || pc.signalingState !== "stable");

                    if (offerCollision) {
                        if (!isPolite) {
                            console.log("Impolite peer: ignoring colliding offer");
                            return;
                        }
                        console.log("Polite peer: rolling back local description for colliding offer");
                        await pc.setLocalDescription({ type: "rollback" });
                    }

                    if (payload.type === "offer") {
                        await pc.setRemoteDescription(payload.sdp);
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        console.log("Generated answer for renegotiation");
                        socket.emit("relay", remoteSocketId, { type: "answer", sdp: answer });

                    } else if (payload.type === "answer") {
                        console.log("Received answer, completing negotiation handshake");
                        await pc.setRemoteDescription(payload.sdp);
                    }
                } catch (err) {
                    console.error("Error handling negotiation payload:", err);
                }
            })

            console.log("Attached signaling")
            setAttached(true);
        }
    }

    const [localVideoStream, setLocalVideostream] = useState<MediaStream>();
    const [localAudioStream, setLocalAudioStream] = useState<MediaStream>();


    const endCall = useCallback(() => {
        console.log("Ending call ", localAudioStream, localVideoStream)
        localAudioStream?.getTracks().forEach((track) => track.stop());
        localVideoStream?.getTracks().forEach((track) => track.stop());
        localScreenStream?.getTracks().forEach((track) => track.stop());
        setLocalAudioStream(undefined);
        setLocalVideostream(undefined);
        setLocalScreenStream(undefined);
        setRemoteScreen(undefined)

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
    }, [localAudioStream, localVideoStream, pc])

    const [callState, setCallState] = useState<"ringing" | "connected" | "connecting" | undefined>(undefined);

    const audioRef = useRef<HTMLAudioElement>(null);

    const setStream = (type: "video" | "audio" | "screen", stream: MediaStream | undefined) => {
        switch (type) {
            case "audio":
                setLocalAudioStream(stream);
                break;
            case "video":
                setLocalVideostream(stream);
                break;
            case "screen":
                setLocalScreenStream(stream);
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
        remoteVideo,
        localScreenStream,
        remoteScreen,
        screenSendRef
    }}>
        <audio ref={audioRef} autoPlay></audio>
        {children}
    </CallServiceContext>
}

export type { CallserviceContextData }
export { CallServiceProvider, CallServiceContext }