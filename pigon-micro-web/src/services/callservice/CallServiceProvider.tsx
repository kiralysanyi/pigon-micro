import { createContext, useRef, useState } from "react"

interface CallserviceContextData {
    inCall: boolean
    chatId?: number, // chat id of the call
    startTime?: Date, // start of the call
    audioRef?: React.RefObject<HTMLAudioElement | null>, // optionally expose the ref if we would need to interact with it, for example: changing volume
    setAudio?: (stream: MediaStream | null) => void, // Function to set the audio stream of the call so it plays even if you leave the call ui
    setCall?: (chatId: number) => void, // set states so other pages can display an in call message
    endCall?: () => void // clear out all states
}

const CallServiceContext = createContext<CallserviceContextData>({
    inCall: false
});

const CallServiceProvider = ({ children }: React.PropsWithChildren) => {
    const [inCall, setInCall] = useState(false);
    const [chatId, setChatId] = useState<number>();
    const [startTime, setStartTime] = useState<Date>();

    const setCall = (chatId: number) => {
        setInCall(true);
        setChatId(chatId);
        setStartTime(new Date());
    }

    const endCall = () => {
        setInCall(false);
        setChatId(undefined);
        setStartTime(undefined);
    }

    const audioRef = useRef<HTMLAudioElement>(null);

    const setAudio = (stream: MediaStream | null) => {
        if (audioRef.current) {
            audioRef.current.srcObject = stream;
        } else {
            console.error("Audioref not initialized")
        }
    }

    return <CallServiceContext value={{ inCall: inCall, setCall, chatId, endCall, startTime, setAudio, audioRef }}>
        <audio ref={audioRef} autoPlay></audio>
        {children}
    </CallServiceContext>
}

export type { CallserviceContextData }
export { CallServiceProvider, CallServiceContext }