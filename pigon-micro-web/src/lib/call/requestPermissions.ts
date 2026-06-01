// Helper function to request permissions and probe for hw
const requestPermissions = async (): Promise<{ audio: boolean, video: boolean }> => {
    console.log("Requesting permissions")
    let audio = false;
    let video = false;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        audio = true;
        stream.getTracks().forEach(track => track.stop());
    } catch (error) {
        console.error("Failed to get audio permission", error);
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        video = true;
        stream.getTracks().forEach(track => track.stop());
    } catch (error) {
        console.error("Failed to get video permission", error);
    }

    return {
        audio,
        video
    }
}

export default requestPermissions;