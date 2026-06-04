const openWindow = (url: string) => {
    if (!window.open) {
        location.replace(url);
        return;
    }

    const handle = window.open(url, "callWindow", "popup");
    if (!handle) {
        location.replace(url);
    }
}

export default openWindow