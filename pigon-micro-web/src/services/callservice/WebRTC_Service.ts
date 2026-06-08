class RTCWrapper {
    pc = new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun.l.google.com:5349" },
            { urls: "stun:stun1.l.google.com:3478" },
            { urls: "stun:stun1.l.google.com:5349" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:5349" },
            { urls: "stun:stun3.l.google.com:3478" },
            { urls: "stun:stun3.l.google.com:5349" },
            { urls: "stun:stun4.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:5349" }
        ]
    }); // Create a new instance of the RTCPeerConnection class
    makingOffer = false; // A flag indicating whether the current state is in the process of making an offer
    ignoreOffer = false; // A flag indicating whether to ignore incoming offers based on the polite policy
    isSettingRemoteAnswerPending = false; // A flag indicating whether the current state is in the process of setting a remote answer
    polite = false; // A boolean indicating whether this is a caller or callee, and therefore should behave differently

    private sendF: (data: any) => void; // A function reference to the send function that will be used to send data over the network
    constructor(sendFunc: (data: any) => void, isCaller: boolean) {

        this.sendF = sendFunc;
        this.polite = !isCaller;

        this.pc.addEventListener("connectionstatechange", () => {
            console.log("Connection changed: ", this.pc.connectionState)
        }) // Add an event listener for the connection state change event
        this.pc.addEventListener("negotiationneeded", async () => {
            try {
                this.makingOffer = true; // Set the making offer flag to true
                await this.pc.setLocalDescription(); // Set the local description of the peer connection
                sendFunc({ description: this.pc.localDescription }); // Send the local description over the network
            } catch (error) {
                console.error(error)
            } finally {
                this.makingOffer = false; // Reset the making offer flag to false
            }
        }) // Add an event listener for the negotiation needed event
        this.pc.addEventListener("icecandidate", async ({ candidate }) => {
            sendFunc({ candidate }) // Send the ICE candidate over the network
        }) // Add an event listener for the ICE candidate event
    }

    async receiveHandler({ description, candidate }: any) {
        try {
            if (description) { // If there is a description (i.e., an offer or answer)
                const readyForOffer =
                    !this.makingOffer &&
                    (this.pc.signalingState === "stable" || this.isSettingRemoteAnswerPending); // Check if the peer connection is in the correct state to receive an offer
                const offerCollision = description.type === "offer" && !readyForOffer; // Check if there is a collision between offers

                this.ignoreOffer = !this.polite && offerCollision; // Set the ignore offer flag based on the polite policy
                if (this.ignoreOffer) {
                    return; // Ignore the incoming offer and exit the function
                }
                this.isSettingRemoteAnswerPending = description.type === "answer"; // Set the is setting remote answer pending flag based on the type of description
                await this.pc.setRemoteDescription(description); // Set the remote description of the peer connection
                this.isSettingRemoteAnswerPending = false; // Reset the is setting remote answer pending flag to false

                if (description.type === "offer") { // If the incoming description is an offer
                    await this.pc.setLocalDescription(); // Set the local description of the peer connection
                    this.sendF({ description: this.pc.localDescription }); // Send the local description over the network
                }
            } else if (candidate) { // If there is a candidate (i.e., an ICE candidate)
                try {
                    await this.pc.addIceCandidate(candidate); // Add the ICE candidate to the peer connection
                } catch (err) {
                    if (!this.ignoreOffer) {
                        throw err; // Throw an error if there was an issue adding the ICE candidate and it is not due to a collision between offers
                    }
                }
            }
        } catch (err) {
            console.error(err); // Log any errors that occur
        }
    }
}

export { RTCWrapper }