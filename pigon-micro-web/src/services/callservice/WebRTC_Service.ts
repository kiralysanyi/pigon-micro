class RTCWrapper {
    pc = new RTCPeerConnection();
    makingOffer = false;
    ignoreOffer = false;
    isSettingRemoteAnswerPending = false;
    polite = false;

    private sendF: (data: any) => void;

    constructor(sendFunc: (data: any) => void, isCaller: boolean) {

        this.sendF = sendFunc;
        this.polite = !isCaller;

        this.pc.addEventListener("connectionstatechange", () => {
            console.log("Connection changed: ", this.pc.connectionState)
        })

        this.pc.addEventListener("negotiationneeded", async () => {
            try {
                this.makingOffer = true;
                await this.pc.setLocalDescription();
                sendFunc({ description: this.pc.localDescription });
            } catch (error) {
                console.error(error)
            } finally {
                this.makingOffer = false;
            }
        })

        this.pc.addEventListener("icecandidate", async ({ candidate }) => {
            sendFunc({ candidate })
        })
    }

    async receiveHandler({ description, candidate }: any) {
        try {
            if (description) {
                const readyForOffer =
                    !this.makingOffer &&
                    (this.pc.signalingState === "stable" || this.isSettingRemoteAnswerPending);
                const offerCollision = description.type === "offer" && !readyForOffer;

                this.ignoreOffer = !this.polite && offerCollision;
                if (this.ignoreOffer) {
                    return;
                }
                this.isSettingRemoteAnswerPending = description.type === "answer";
                await this.pc.setRemoteDescription(description);
                this.isSettingRemoteAnswerPending = false;
                if (description.type === "offer") {
                    await this.pc.setLocalDescription();
                    this.sendF({ description: this.pc.localDescription });
                }
            } else if (candidate) {
                try {
                    await this.pc.addIceCandidate(candidate);
                } catch (err) {
                    if (!this.ignoreOffer) {
                        throw err;
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }
    }
}

export { RTCWrapper }