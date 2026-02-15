import { useState } from "react";
import { encrypt, generateECDHKeyPair } from "../lib/encryption/ecdh";
import { encodeEncryptedData, exportPrivateKeyToBase64, exportPublicKeyToBase64 } from "../lib/encryption/utils";
import axios from "axios";
import { BASEURL } from "../conf";
import getAccessToken from "../lib/auth/getAccessToken";
import { useNavigate } from "react-router";

// page for setting up keystore and other cryptographic shit
const SetupPage = () => {
    const [statusText, setStatusText] = useState("Set up password for keyring");
    const [creating, setCreating] = useState(false);

    const [error, setError] = useState<string>()

    const [kpass, setKpass] = useState("");
    const [kpass1, setKpass1] = useState("");

    const navigate = useNavigate();

    const create = () => {
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

        generateECDHKeyPair().then(async (keypair) => {
            setStatusText("Generating keys");
            const pub = await exportPublicKeyToBase64(keypair.publicKey);
            const priv = await exportPrivateKeyToBase64(keypair.privateKey);
            setStatusText("Encrypting private key for storage");
            const encryptedPKey = encodeEncryptedData(await encrypt(priv, kpass));
            setStatusText("Uploading keys")
            axios.post(BASEURL + "/api/v1/keyring/pubkey",
                { pubKey: pub },
                { headers: { Authorization: `Bearer ${await getAccessToken()}` } }
            ).then(async (response) => {
                if (response.status == 201) {
                    axios.post(BASEURL + "/api/v1/keyring/privkey", { encryptedPrivKey: encryptedPKey }, { headers: { Authorization: `Bearer ${await getAccessToken()}` } }).then((response) => {
                        if (response.status == 201) {
                            setStatusText("Keys uploaded successfully")
                            setTimeout(() => {
                                console.log("Navigate to keyring unlock")
                                navigate("/unlock")
                            }, 300);
                        } else {
                            setStatusText("Failed to upload private key")
                            setCreating(false)
                            console.log(response.data)
                        }
                    }).catch((error) => {
                        console.error("Failed to upload private key", error)
                        setStatusText("Failed to upload private key")
                        setCreating(false)
                    })
                } else {
                    console.log(response.data)
                    setStatusText("Failed to upload public key")
                    setCreating(false)
                }


            }).catch((error) => {
                console.error("Failed to upload public key: ", error);
                setStatusText("Failed to upload public key")
                setCreating(false)
            })


        })
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