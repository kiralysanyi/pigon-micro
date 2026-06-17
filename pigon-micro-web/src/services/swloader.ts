import api from './apiservice.ts';
const loadSW = () => {

    // register sw.js
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(async (registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
                try {
                    if (Notification.permission != "granted") {
                        if (await Notification.requestPermission() != "granted") {
                            return;
                        }
                    }
                    const existing = await registration.pushManager.getSubscription()
                    if (existing == null) {
                        const response = await api.get("/push/vapidkey");
                        const subscription = await registration.pushManager.subscribe({ applicationServerKey: response.data.key, userVisibleOnly: true })
                        await api.post("/push/subscribe", { sub: subscription });
                        console.log("Subscribed to notifications")
                    } else {
                        console.log("Already subscribed")
                    }
                } catch (error) {
                    console.error("Failed to subscribe", error)
                }
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    }
}

export default loadSW;