const getScreen = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: {
            frameRate: 24,
            width: {
                max: 1920,
                ideal: 1920
            },
            height: {
                max: 1080,
                ideal: 1080
            }
        }
    })
    const track = stream.getVideoTracks()[0];
    track.contentHint = "detail";
    return new MediaStream([track]);
}

export default getScreen