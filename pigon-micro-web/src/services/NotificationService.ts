// This is responsible for sending notifications if the app is open but not in foreground
class NotificationService {
    constructor() {
        if (Notification.permission != "granted") {
            Notification.requestPermission();
        }
    }

    sendNotif(title: string, content: string) {
        if (document.hasFocus()) {
            return;
        }
        try {
            new Notification(title, { body: content });
        } catch (error) {
            console.error("Failed to show notification: ", error)
        }
    }
}


export default NotificationService;