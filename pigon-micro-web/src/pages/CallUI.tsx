import { MicrophoneIcon, PhoneArrowDownLeftIcon, TvIcon, VideoCameraIcon } from "@heroicons/react/16/solid";
import "../styles/callui.css"
import checkScreenShareSupport from "../lib/call/checkScreenShareSupport";
import { useState } from "react";

const CallUI = () => {
    const [vMuted, setVMuted] = useState(false);
    const [aMuted, setAMuted] = useState(false);

    return <>
        <div className="callui">
            <div className="state"></div>

            <div className="dock">
                <button className="red">
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