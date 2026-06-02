import { useNavigate, useParams, useSearchParams } from "react-router";
import "../styles/callui.css"
import { MicrophoneIcon, PhoneArrowDownLeftIcon, TvIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { CallServiceContext } from "../services/callservice/CallServiceProvider";
import requestPermissions from "../lib/call/requestPermissions";
import getUserMedia from "../lib/call/getUserMedia";
import ringUser from "../lib/call/ringer";
import getUserInfo from "../lib/auth/getUserInfo";
import api from "../services/apiservice";
import { getSocket } from "../lib/socket";
import checkScreenShareSupport from "../lib/call/checkScreenShareSupport";
import getScreen from "../lib/call/getScreen";

const CallUI = () => {
    const navigate = useNavigate();
    const params = useParams();
    const [sparams] = useSearchParams();

    const localRef = useRef<HTMLVideoElement>(null);
    const remoteRef = useRef<HTMLVideoElement>(null);

    const callService = useContext(CallServiceContext);
    const [remotePeerId, setRemotePeerId] = useState<string | undefined>(undefined);

    const [finishedPermCheck, setFinishedPermCheck] = useState(false);

    useEffect(() => {
        if (sparams.get("remoteId") != undefined) {
            setRemotePeerId(sparams.get("remoteId") as string)
        }
    }, [])

    useEffect(() => {
        if (remoteRef.current == undefined) {
            return;
        }

        if (callService.remoteVideo) {
            remoteRef.current.srcObject = callService.remoteVideo;
        } else {
            remoteRef.current.srcObject = null;
        }
    }, [callService.remoteVideo])

    useEffect(() => {
        // Check if chat is direct chat

        // Check if you are initiating or you are invited

        callService.setCall?.(parseInt(params.id as string));

        callService.setCallState?.("ringing");
        let videoStream: MediaStream;
        let audioStream: MediaStream;

        const initCall = () => {
            requestPermissions().then(async (granted) => {
                if (granted.audio) {
                    console.log("Got audio permission")
                    audioStream = await getUserMedia({ audio: true, video: false });
                    callService.setStream?.("audio", audioStream);
                } else {
                    console.log("No audio permission");
                }

                if (granted.video) {
                    console.log("Got video permission")
                    videoStream = await getUserMedia({ audio: false, video: true });
                    callService.setStream?.("video", videoStream);
                } else {
                    console.log("No video permission");
                }
                setFinishedPermCheck(true)
            })
        }

        // ring
        (async () => {
            initCall();
            // if you are being called, do not call ringing stuff, and jump to webrtc setup
            if (sparams.get("callee") == "true") {
                return;
            }
            const userinfo = await getUserInfo();
            api.get("/chat/" + params.id).then((response) => {
                if (response.data.chat.type != "direct") {
                    console.error("Chat is not a direct chat, call aborted");
                    leaveCall();
                    return;
                }
                const participants = response.data.chat.participants as any[];
                console.log(participants)
                const userToCall: number = participants.filter((p) => p.id != userinfo.ID)[0].id;
                console.log(userToCall)
                ringUser(userToCall).then((response) => {
                    if (response.accepted == false) {
                        window.alert("User declined call");
                        audioStream.getTracks().forEach((track) => track.stop());
                        videoStream.getTracks().forEach((track) => track.stop());
                        leaveCall();
                    } else {
                        console.log("User accepted call");
                        setRemotePeerId(response.socketId);
                    }
                })
            }).catch((err) => {
                console.error("Failed to call user: ", err);
                leaveCall();
            })
        })()
    }, []);

    useEffect(() => {
        if (callService.inCall == false) {
            console.log("inCall state is false, aborting init")
            return;
        }
        if (finishedPermCheck == false) {
            console.warn("Waiting for permission checks");
            return;
        }

        if (callService.localAudioStream == undefined && callService.localVideoStream == undefined && callService.callState != "connected") {
            console.error("Cannot start call with zero streams");
            return
        }

        if (callService.pc == undefined) {
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
            })

            // attach streams
            if (callService.localAudioStream) {
                pc.addTrack(callService.localAudioStream.getAudioTracks()[0])
            }
            if (callService.localVideoStream) {
                pc.addTrack(callService.localVideoStream.getVideoTracks()[0])
            }

            callService.setPc?.(pc);
            return;
        }

        if (remotePeerId == undefined) {
            console.error("Remote peer id is not defined")
            return;
        }

        if (callService.callState != "ringing") {
            return;
        }

        let detach = () => { };

        (async () => {
            console.log("Attaching shit")
            await callService.attachSignaling?.(remotePeerId, sparams.get("callee") != "true");
            if (sparams.get("callee") == "true") {
                // handle offer answering

                console.log("Callee mode")
            } else {
                // handle offer creation and answer handling
                // emit offer
                let offerInterval = setInterval(async () => {
                    if (callService.callState == "connected") {
                        clearInterval(offerInterval);
                        return;
                    }
                    console.log("Offering")
                    await callService.emitOffer?.(remotePeerId);
                }, 1000);

                detach = () => clearInterval(offerInterval);
            }
        })();

        return () => {
            console.log("Detaching");
            detach();
        }


    }, [callService.pc, remotePeerId, finishedPermCheck, callService.inCall, callService.localAudioStream, callService.localVideoStream, callService.callState])

    useEffect(() => {
        if (localRef.current) {
            localRef.current.srcObject = callService.localVideoStream ? callService.localVideoStream : null
        }
    }, [callService.localVideoStream]);

    const leaveCall = () => {
        console.log("Leave call")
        getSocket().then((socket) => {
            socket.emit("relay", remotePeerId, { type: "call-end" })
        })
        callService.endCall?.();
        // Disconnect webrtc and stuff


        // leave ui
        navigate(`/`)
    }

    useEffect(() => {
        let handleFunc = ({ from, payload }: any) => {
            if (from == remotePeerId) {
                if (payload.type == "call-end") {
                    window.alert("Call ended")
                    leaveCall();
                }
            }
        }
        if (remotePeerId) {
            getSocket().then((socket) => {
                socket.on("relay", handleFunc)
            })
        }

        return () => {
            if (remotePeerId) {
                getSocket().then((socket) => {
                    socket.off("relay", handleFunc)
                })
            }
        }
    }, [remotePeerId, callService.localAudioStream, callService.localScreenStream, callService.localVideoStream, callService.pc])

    const [vMuted, setVMuted] = useState(false);
    const [aMuted, setAMuted] = useState(false);

    const toggleVideo = () => {
        if (callService.localVideoStream) {
            callService.localVideoStream.getTracks().forEach((track) => track.enabled = vMuted);
            setVMuted(!vMuted);
        }
    }

    const toggleAudio = () => {
        if (callService.localAudioStream) {
            callService.localAudioStream.getTracks().forEach((track) => track.enabled = aMuted);
            setAMuted(!aMuted)
        }
    }

    const toggleScreenShare = useCallback(async () => {
        if (callService.pc == undefined || callService.screenSendRef == undefined) {
            return;
        }

        const stopScreenShare = async (sender: RTCRtpSender, stream: MediaStream) => {
            stream.getTracks().forEach(track => track.stop());
            callService.pc?.removeTrack(sender);
            callService.setStream?.("screen", undefined);

            // Await the socket here too
            const socket = await getSocket();
            socket.emit("relay", remotePeerId, { type: "screen-stop" });
        };

        if (callService.localScreenStream == undefined) {
            try {
                const stream = await getScreen();
                const videoTrack = stream.getVideoTracks()[0];

                const socket = await getSocket();

                socket.emit("relay", remotePeerId, { type: "screen-start", streamId: stream.id });

                const sender = callService.pc.addTrack(videoTrack, stream);
                callService.screenSendRef.current = sender;


                videoTrack.addEventListener("ended", () => {
                    stopScreenShare(sender, stream);
                });

                callService.setStream?.("screen", stream);

            } catch (error) {
                console.error(error)
            }
        } else {
            if (callService.screenSendRef.current) {
                stopScreenShare(callService.screenSendRef.current, callService.localScreenStream);
            }
        }
    }, [callService.pc, callService.localScreenStream, callService.screenSendRef, callService.setStream, remotePeerId])

    const screenViewRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (screenViewRef.current) {
            screenViewRef.current.srcObject = callService.remoteScreen ? callService.remoteScreen : null
        }
    }, [callService.remoteScreen])

    return <>
        <div className="callui">
            <div className={`selfview ${callService.callState == "connected" ? "selfview-minimized" : ""}`}>
                <video autoPlay muted ref={localRef}></video>
            </div>
            <video className="screenview" autoPlay muted ref={screenViewRef}></video>
            <div className={`remoteview ${callService.remoteScreen ? "remote-minimized" : ""}`}>
                <video autoPlay muted ref={remoteRef}></video>
            </div>
            {callService.callState !== "connected" && (
                <div className="state">{callService.callState}</div>
            )}
            <div className="dock">
                <button className="red" onClick={leaveCall}>
                    <PhoneArrowDownLeftIcon width={24} height={24} />
                </button>
                {/* Buttons only shown after call accepted */}
                {callService.callState == "connected" && <>
                    <button className={!vMuted ? "red" : ""} onClick={toggleVideo}>
                        <VideoCameraIcon width={24} height={24} />
                    </button>
                    <button className={!aMuted ? "red" : ""} onClick={toggleAudio}>
                        <MicrophoneIcon width={24} height={24} />
                    </button>
                    {checkScreenShareSupport() ? <button className={callService.localScreenStream ? "red" : ""} onClick={toggleScreenShare}>
                        <TvIcon width={24} height={24} />
                    </button> : ""}
                </>}
            </div>
        </div>
    </>
}

export default CallUI;