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
import getScreen from "../lib/call/getScreen";

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
    const remoteScreenRef = useRef<HTMLVideoElement>(null);

    const localScreenStreamRef = useRef<MediaStream | null>(null);
    const [streaming, setStreaming] = useState(false);

    const [minimizeLocal, setMinimizeLocal] = useState(false);
    const [minimizeRemote, setMinimizeRemote] = useState(false);

    const [remoteUserId, setRemoteUserId] = useState<number>();
    const [remoteSocketId, setRemoteSocketId] = useState<string>();
    const [accepted, setAccepted] = useState(false);
    const rtcRef = useRef<RTCWrapper>(null);

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

    // handle mute
    useEffect(() => {
        if (localAudioStreamRef.current) {
            localAudioStreamRef.current.getTracks().forEach((track) => track.enabled = !aMuted)
        }

        if (localVideoStreamRef.current) {
            localVideoStreamRef.current.getTracks().forEach((track) => track.enabled = !vMuted)
        }
    }, [vMuted, aMuted])

    // cleanup
    useEffect(() => {
        return () => {
            if (localVideoStreamRef.current) {
                localVideoStreamRef.current.getTracks().forEach((track) => track.stop());
            }

            if (localAudioStreamRef.current) {
                localAudioStreamRef.current.getTracks().forEach((track) => track.stop());
            }

            if (localScreenStreamRef.current) {
                localScreenStreamRef.current.getTracks().forEach((track) => track.stop());
            }

            getSocket().then((socket) => {
                socket.off("relay")
            })
        }
    }, [])


    // main logic
    useEffect(() => {
        let remoteId = sparams.get("remoteId");
        let isCaller = remoteId == null;
        let chatId = parseInt(params.id as string);

        if (remoteId) {
            setRemoteSocketId(remoteId);
        }

        getSocket().then(async (socket) => {
            const setupRtc = async () => {
                console.log("Socket id: ", socket.id)
                const webrtc = new RTCWrapper((data) => {
                    socket.emit("relay", remoteId, data)
                }, isCaller);

                rtcRef.current = webrtc;
                let expectingScreenTrack = false;

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

                    if (payload.trackId) {
                        console.log("Got screen share track id:", payload.trackId)
                        expectingScreenTrack = true;
                        // send ack to remote peer so it starts streaming
                        console.log("Emit id-ack", payload.trackId);
                        socket.emit("relay", remoteId, { type: "id-ack" })
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
                webrtc.pc.addEventListener("track", ({ track }) => {
                    if (expectingScreenTrack == true && track.kind == "video") {
                        expectingScreenTrack = false;
                        if (remoteScreenRef.current) {
                            remoteScreenRef.current.srcObject = new MediaStream([track]);
                            setMinimizeRemote(true);
                            const handleRelay = ({ from, payload }: any) => {
                                if (from == remoteId) {
                                    if (payload.type == "screen-end") {
                                        console.log("Screen share ended!")
                                        setMinimizeRemote(false);
                                        if (remoteScreenRef.current) {
                                            remoteScreenRef.current.srcObject = null
                                        }
                                        socket.off("relay", handleRelay);
                                    }
                                }
                            }
                            socket.on("relay", handleRelay)
                        }
                        return;
                    }

                    if (track.kind == "video" && remoteVideoRef.current?.srcObject) {
                        console.error("Unknown video track!", track.id);
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

    const stopStream = () => {
        setStreaming(false);
        if (localScreenStreamRef.current) {
            localScreenStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        getSocket().then((socket) => {
            socket.emit("relay", remoteSocketId, { type: "screen-end" });
        })
    }

    const startStream = () => {
        getSocket().then(async (socket) => {
            if (rtcRef.current) {
                const stream = await getScreen();
                const track = stream.getVideoTracks()[0];
                setStreaming(true);
                let sender: RTCRtpSender;
                track.addEventListener("ended", () => {
                    if (sender) {
                        rtcRef.current?.pc.removeTrack(sender);
                    }
                    stopStream();
                })

                socket.emit("relay", remoteSocketId, { trackId: track.id });
                localScreenStreamRef.current = stream;
                const handleAck = ({ from, payload }: any) => {
                    if (from != remoteSocketId) {
                        return;
                    }
                    if (rtcRef.current && payload.type == "id-ack") {
                        console.log("id-ack", track.id)
                        sender = rtcRef.current.pc.addTrack(track);
                        socket.off("relay", handleAck)
                    }
                }

                socket.on("relay", handleAck);
            }
        })
    }

    const toggleStream = () => {
        if (streaming) {
            stopStream();
        } else {
            startStream();
        }
    }

    return <>
        <div className="callui">
            <audio hidden ref={remoteAudioRef} autoPlay playsInline></audio>
            <video ref={remoteScreenRef} className="remote-screen" autoPlay playsInline muted></video>
            <video ref={remoteVideoRef} className={`remote-video ${minimizeRemote ? "remote-video-minimized" : ""}`} autoPlay playsInline></video>
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
                    {checkScreenShareSupport() ? <button onClick={toggleStream} className={streaming ? "red" : ""}>
                        <TvIcon width={24} height={24} />
                    </button> : ""}
                </>
            </div>
        </div>
    </>
}

export default CallUI;