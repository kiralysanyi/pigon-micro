const checkScreenShareSupport = (): boolean => {
    if (navigator.mediaDevices.getDisplayMedia != undefined) {
        return true
    } else {
        return false;
    }
}

export default checkScreenShareSupport;