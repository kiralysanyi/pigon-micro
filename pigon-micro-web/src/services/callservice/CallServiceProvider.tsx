import { createContext, useRef, useState } from "react"

interface CallserviceContextData {
    inCall: boolean,
    callState?: "ringing" | "connected" | "connecting",
    setCallState?: React.Dispatch<React.SetStateAction<"connected" | "connecting" | "ringing" | undefined>>
    chatId?: number, // chat id of the call
    startTime?: Date, // start of the call
    audioRef?: React.RefObject<HTMLAudioElement | null>, // optionally expose the ref if we would need to interact with it, for example: changing volume
    setAudio?: (stream: MediaStream | null) => void, // Function to set the audio stream of the call so it plays even if you leave the call ui
    setCall?: (chatId: number) => void, // set states so other pages can display an in call message
    endCall?: () => void, // clear out all states
    localVideoStream?: MediaStream,
    localAudioStream?: MediaStream,
    setStream?: (type: "audio" | "video", stream: MediaStream | undefined) => void,
    pc?: RTCPeerConnection,
    setPc?: React.Dispatch<React.SetStateAction<RTCPeerConnection | undefined>>
}

const CallServiceContext = createContext<CallserviceContextData>({
    inCall: false
});

const CallServiceProvider = ({ children }: React.PropsWithChildren) => {
    const [inCall, setInCall] = useState(false);
    const [chatId, setChatId] = useState<number>();
    const [startTime, setStartTime] = useState<Date>();
    const [pc, setPc] = useState<RTCPeerConnection | undefined>(undefined)

    const setCall = (chatId: number) => {
        setInCall(true);
        setChatId(chatId);
        setStartTime(new Date());
    }

    const endCall = () => {
        localAudioStream?.getAudioTracks().forEach((track) => track.stop());
        localVideoStream?.getAudioTracks().forEach((track) => track.stop());
        setLocalAudioStream(undefined);
        setLocalVideostream(undefined);

        setInCall(false);
        setChatId(undefined);
        setStartTime(undefined);
        setCallState(undefined);
    }

    const [callState, setCallState] = useState<"ringing" | "connected" | "connecting" | undefined>(undefined);
    const [localVideoStream, setLocalVideostream] = useState<MediaStream>();
    const [localAudioStream, setLocalAudioStream] = useState<MediaStream>();

    const audioRef = useRef<HTMLAudioElement>(null);

    const setAudio = (stream: MediaStream | null) => {
        if (audioRef.current) {
            audioRef.current.srcObject = stream;
        } else {
            console.error("Audioref not initialized")
        }
    }

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

    return <CallServiceContext value={{ inCall: inCall, setCall, chatId, endCall, startTime, setAudio, audioRef, callState, setCallState, localAudioStream, localVideoStream, setStream, pc, setPc }}>
        <audio ref={audioRef} autoPlay></audio>
        {children}
    </CallServiceContext>
}

export type { CallserviceContextData }
export { CallServiceProvider, CallServiceContext }