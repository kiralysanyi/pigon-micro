import { MicrophoneIcon, PhoneArrowDownLeftIcon, TvIcon, VideoCameraIcon } from "@heroicons/react/16/solid";
import "../styles/callui.css"
import checkScreenShareSupport from "../lib/call/checkScreenShareSupport";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import getUserIdForCall from "../lib/call/getUserIdForCall";
import ringUser from "../lib/call/ringer";
import { getSocket } from "../lib/socket";
import { RTCWrapper } from "../services/callservice/WebRTC_Service";
import getUserMedia from "../lib/call/getUserMedia";

const CallUI = () => {
    const [vMuted, setVMuted] = useState(false);
    const [aMuted, setAMuted] = useState(false);

    const [sparams] = useSearchParams();
    const params = useParams();

    const [message, setMessage] = useState<string | null>(null);

    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoStreamRef = useRef<MediaStream>(null);
    const localAudioStreamRef = useRef<MediaStream>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    const [minimizeLocal, setMinimizeLocal] = useState(false);

    const [remoteUserId, setRemoteUserId] = useState<number>();
    const [remoteSocketId, setRemoteSocketId] = useState<string>();
    const [accepted, setAccepted] = useState(false);

    const navigate = useNavigate();

    const endCall = () => {
        getSocket().then((socket) => {
            if (remoteUserId && !accepted) {
                socket.emit("ring-end", remoteUserId);
                navigate("/", { viewTransition: true });
                return;
            }

            socket.emit("relay", remoteSocketId, { type: "call-end" });
            navigate("/")
        })
    }

    useEffect(() => {
        if (localAudioStreamRef.current) {
            localAudioStreamRef.current.getTracks().forEach((track) => track.enabled = !aMuted)
        }

        if (localVideoStreamRef.current) {
            localVideoStreamRef.current.getTracks().forEach((track) => track.enabled = !vMuted)
        }
    }, [vMuted, aMuted])

    useEffect(() => {
        return () => {
            if (localVideoStreamRef.current) {
                localVideoStreamRef.current.getTracks().forEach((track) => track.stop());
            }

            if (localAudioStreamRef.current) {
                localAudioStreamRef.current.getTracks().forEach((track) => track.stop());
            }

            getSocket().then((socket) => {
                socket.off("relay")
            })
        }
    }, [])

    useEffect(() => {
        let remoteId = sparams.get("remoteId");
        let isCaller = remoteId == null;
        let chatId = parseInt(params.id as string);

        getSocket().then(async (socket) => {
            const setupRtc = async () => {
                console.log("Socket id: ", socket.id)
                const webrtc = new RTCWrapper((data) => {
                    socket.emit("relay", remoteId, data)
                }, isCaller);

                // relay listener
                socket.on("relay", ({ from, payload }) => {
                    if (from != remoteId) {
                        console.log("Ignored data from: ", from)
                        console.log("Allowing from: ", remoteId)
                        return;
                    }

                    if (payload.description != undefined || payload.candidate != undefined) {
                        webrtc.receiveHandler(payload);
                        return;
                    }

                    if (payload.type == "call-end") {
                        setMessage("Call ended");
                        setTimeout(() => {
                            navigate("/")
                        }, 5000);
                    }

                })

                // listen for streams
                let screenTrackId = null;
                webrtc.pc.addEventListener("track", ({ track }) => {
                    if (track.id == screenTrackId && track.kind == "video") {
                        // TODO: implement screen track handling
                        return;
                    }

                    if (track.kind == "video") {
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = new MediaStream([track]);
                            setMinimizeLocal(true)
                        }
                    }

                    if (track.kind == "audio") {
                        if (remoteAudioRef.current) {
                            remoteAudioRef.current.srcObject = new MediaStream([track])
                        }
                    }
                })

                // add streams

                let videoStream;
                let audioStream;
                try {
                    videoStream = await getUserMedia({ audio: false, video: true });
                    localVideoStreamRef.current = videoStream;
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = videoStream;
                    }
                    webrtc.pc.addTrack(videoStream.getVideoTracks()[0]);
                } catch (error) {
                    console.log("Failed to add video stream")
                }

                try {
                    audioStream = await getUserMedia({ audio: true, video: false });
                    localAudioStreamRef.current = audioStream;
                    webrtc.pc.addTrack(audioStream.getAudioTracks()[0]);
                } catch (error) {
                    console.log("Failed to add audio stream")
                }
            }


            if (isCaller) {
                // caller code
                getUserIdForCall(chatId).then(async (targetUserId) => {
                    setRemoteUserId(targetUserId);
                    const response = await ringUser(targetUserId, chatId);
                    if (response.accepted == false) {
                        setMessage(`Call ended. Reason: ${response.reason}`)
                        setTimeout(() => {
                            navigate("/")
                        }, 2000);
                        return;
                    }

                    setAccepted(true)

                    // call accepted, set up transport
                    remoteId = response.socketId;
                    setRemoteSocketId(remoteId);

                    setupRtc()
                })
                return;
            }

            if (!remoteId) {
                console.error("No remote id");
                setMessage("No remote id");
                return;
            }

            setupRtc();
        })
    }, [])

    return <>
        <div className="callui">
            <audio hidden ref={remoteAudioRef} autoPlay playsInline></audio>
            <video ref={remoteVideoRef} className="remote-video" autoPlay playsInline></video>
            <video ref={localVideoRef} className={`local-video ${minimizeLocal ? "local-video-minimized" : ""}`} autoPlay muted playsInline></video>
            {message && <div className="state">{message}</div>}
            <div className="dock">
                <button className="red" onClick={endCall}>
                    <PhoneArrowDownLeftIcon width={24} height={24} />
                </button>
                {/* Buttons only shown after call accepted */}
                <>
                    <button className={!vMuted ? "red" : ""} onClick={() => setVMuted(!vMuted)}>
                        <VideoCameraIcon width={24} height={24} />
                    </button>
                    <button className={!aMuted ? "red" : ""} onClick={() => setAMuted(!aMuted)}>
                        <MicrophoneIcon width={24} height={24} />
                    </button>
                    {checkScreenShareSupport() ? <button className={""}>
                        <TvIcon width={24} height={24} />
                    </button> : ""}
                </>
            </div>
        </div>
    </>
}

export default CallUI;