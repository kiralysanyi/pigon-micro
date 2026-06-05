import { useEffect, useState } from "react";
import { generateECDHKeyPair } from "../lib/encryption/ecdh";
import { exportPrivateKeyToBase64, exportPublicKeyToBase64 } from "../lib/encryption/utils";
import getAccessToken from "../lib/auth/getAccessToken";
import { useNavigate } from "react-router";
import { generateMasterKey, masterEncrypt } from "../lib/encryption/masterkey";
import uploadMasterKey from "../lib/encryption/uploadMasterKey";
import uploadChatKeyPair from "../lib/chat/uploadChatKeyPair";
import api from "../services/apiservice";

// page for setting up keystore and other cryptographic shit
const SetupPage = () => {
    const [statusText, setStatusText] = useState("Set up password for keyring");
    const [creating, setCreating] = useState(false);

    const [error, setError] = useState<string>()

    const [kpass, setKpass] = useState("");
    const [kpass1, setKpass1] = useState("");

    const navigate = useNavigate();

    // check auth
    useEffect(() => {
        getAccessToken().catch(() => {
            navigate("/login", { viewTransition: true })
        })
    }, [])

    const create = async () => {
        setError(undefined)
        setStatusText("Creating keyring");
        setCreating(true);

        if (kpass.length < 12) {
            setError("Password has to be at least 12 characters long");
            setStatusText("Set up password for keyring");
            setCreating(false);
            return;
        }

        if (kpass !== kpass1) {
            setError("Password mismatch");
            setStatusText("Set up password for keyring");
            setCreating(false);
            return;
        }

        try {
            // generate masterKey
            const masterKey = await generateMasterKey();
            // upload masterkey
            await uploadMasterKey(masterKey, kpass)

            // generate user ecdh keypair (long lived ones)
            const keypair = await generateECDHKeyPair();
            setStatusText("Generating keys");
            const pub = await exportPublicKeyToBase64(keypair.publicKey);
            const priv = await exportPrivateKeyToBase64(keypair.privateKey);
            setStatusText("Encrypting private key for storage");
            const encryptedPKey = await masterEncrypt(priv, masterKey)
            setStatusText("Uploading keys")

            // send ecdh public key
            const publicKeyResponse = await api.post("/keyring/pubkey", { pubKey: pub });
            if (publicKeyResponse.status !== 201) {
                throw new Error("Failed to upload public key");
            }

            // send ecdh private key
            const privateKeyResponse = await api.post("/keyring/privkey", { encryptedPrivKey: encryptedPKey });
            if (privateKeyResponse.status !== 201) {
                throw new Error("Failed to upload private key");
            }

            setStatusText("Setting up initial chat keys")
            // set up first shared chat keypair (ecdh)
            await uploadChatKeyPair(masterKey);
            navigate("/unlock", { viewTransition: true })

        } catch (err) {
            console.error(err);
            setStatusText("Failed to create keyring");
            setCreating(false);
        }
    }
    return <>
        <div className="modal">
            <h2>{statusText}</h2>
            {error && <div className="error-msg">{error}</div>}
            {creating ?
                <div className="spinner" style={{ marginLeft: "auto", marginRight: "auto" }}></div> :
                <>
                    <div className="error-msg">
                        <b>Warning! If you forget your keyring password you will not be able to access any previous messages!!!</b>
                        <br />
                        <span>You have been warned.</span>
                    </div>
                    <div className="form-group">
                        <label htmlFor="kpass">Keyring password</label>
                        <input value={kpass} onChange={(e) => { setKpass(e.target.value) }} type="password" name="kpass" id="kpass" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="kpass1">Confirm keyring password</label>
                        <input value={kpass1} onChange={(e) => { setKpass1(e.target.value) }} type="password" name="kpass1" id="kpass1" />
                    </div>
                    <button onClick={create}>Create keyring</button>
                </>
            }
        </div>
    </>
}

export default SetupPage;