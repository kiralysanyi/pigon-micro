import { ArrowLeftCircleIcon } from "@heroicons/react/16/solid";
import { useNavigate, useParams } from "react-router";
import "../styles/callui.css"
import { MicrophoneIcon, PhoneArrowDownLeftIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { useContext, useEffect, useState } from "react";
import { CallServiceContext } from "../services/callservice/CallServiceProvider";

const CallUI = () => {
    const navigate = useNavigate();
    const params = useParams();

    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [microphoneEnabled, setMicrophoneEnabled] = useState(false);

    const callService = useContext(CallServiceContext);

    useEffect(() => {
        // Check if chat is direct chat

        // Check if you are initiating or you are invited

        callService.setCall?.(parseInt(params.id as string));
        
        callService.setCallState?.("ringing");
        
        // init webrtc, socket io stuff
        
    }, []);

    const leaveCall = () => {
        console.log("Leave call")
        callService.endCall?.();
        // Disconnect webrtc and stuff

        // leave ui
        navigate(`/chat/${params.id}`)
    }

    return <>
        <div className="header">
            <button onClick={() => {
                if (callService.callState != "connected") {
                    leaveCall();
                } else {
                    navigate(`/chat/${params.id}`)
                }
            }}><ArrowLeftCircleIcon width={24} height={24} /></button>
        </div>
        <div className="callui">
            <div className="dock">
                <button className="red" onClick={leaveCall}>
                    <PhoneArrowDownLeftIcon width={24} height={24} />
                </button>
                {/* Buttons only shown after call accepted */}
                {callService.callState == "connected" && <>
                    <button className={cameraEnabled ? "red" : ""} onClick={() => setCameraEnabled(!cameraEnabled)}>
                        <VideoCameraIcon width={24} height={24} />
                    </button>
                    <button className={microphoneEnabled ? "red" : ""} onClick={() => setMicrophoneEnabled(!microphoneEnabled)}>
                        <MicrophoneIcon width={24} height={24} />
                    </button>
                </>}
            </div>
        </div>
    </>
}

export default CallUI;