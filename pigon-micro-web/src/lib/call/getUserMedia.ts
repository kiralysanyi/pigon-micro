const getUserMedia = async ({ audio, video }: { audio: boolean, video: boolean }): Promise<MediaStream> => {
    let audioConf: MediaTrackConstraints = {
        noiseSuppression: true,
        echoCancellation: true
    };
    let videoConf: MediaTrackConstraints = {
        frameRate: 20,
        backgroundBlur: true,
        width: { ideal: 1280, max: 1280 },
        height: { ideal: 720, max: 720 }
    };
    console.log("Requesting media")
    const stream = await navigator.mediaDevices.getUserMedia({ audio: audio ? audioConf : false, video: video ? videoConf : false });

    return stream;
}

export default getUserMedia;