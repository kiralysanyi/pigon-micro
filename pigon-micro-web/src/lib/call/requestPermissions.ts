// Helper function to request permissions and probe for hw
const requestPermissions = async (): Promise<{ audio: boolean, video: boolean }> => {
    console.log("Requesting permissions")
    let audio = false;
    let video = false;
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        audio = true
    } catch (error) {
        console.error("Failed to get audio permission")
    }

    try {
        await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
        video = true
    } catch (error) {
        console.error("Failed to get video permission")
    }

    return {
        audio,
        video
    }
}

export default requestPermissions;