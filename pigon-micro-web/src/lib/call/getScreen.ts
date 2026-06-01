const getScreen = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: {
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

    return stream;
}

export default getScreen