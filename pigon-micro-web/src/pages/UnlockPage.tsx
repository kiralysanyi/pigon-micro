import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import getMasterKey from "../lib/encryption/getMasterKey";
import { masterDecrypt } from "../lib/encryption/masterkey";
import { KeyRingContext } from "../services/KeyRingProvider";
import { importECDHPrivateKeyFromBase64, importECDHPublicKeyFromBase64 } from "../lib/encryption/utils";
import api from "../services/apiservice";
import { saveKey } from "../lib/indexedDB/keyDB";

const UnlockPage = () => {
    const [loading, setLoading] = useState(true);
    const [statusText, setStatusText] = useState("Fetching keys");
    const [error, setError] = useState<string>()
    const [encryptedPrivkey, setEncryptedPrivkey] = useState<string>();
    const [pubkey, setPubkey] = useState<string>();
    const [kpass, setKpass] = useState("");
    const krp = useContext(KeyRingContext)

    const navigate = useNavigate()

    useEffect(() => {
        (async () => {
            try {
                // get private key
                const response = await api.get("/keyring/privkey");
                console.log("Got private key")
                if (response.data.data.encryptedPrivKey == null) {
                    return navigate("/setup", { viewTransition: true })
                }
                setEncryptedPrivkey(response.data.data.encryptedPrivKey);

                // get public key
                const pubkeyResponse = await api.get("/keyring/pubkey");
                console.log("Got public key")
                setPubkey(pubkeyResponse.data.data.pubKey);
                setLoading(false);
                setStatusText("Unlock keyring")
            } catch (err: any) {
                if (err.response) {
                    if (err.response.status == 401) {
                        navigate("/login", { viewTransition: true })
                    } else {
                        setError("Error: " + err.response.data.message)
                    }
                } else {
                    setError("Network error")
                }
            }
        })()

    }, []);

    const unlock = async () => {
        setError(undefined);
        setLoading(true);

        if (encryptedPrivkey && pubkey) {
            try {
                const masterKey = await getMasterKey(kpass);
                // Load masterkey to context
                krp?.setMasterKey(masterKey);

                // Decrypt user keys
                const decrypted = await masterDecrypt(encryptedPrivkey, masterKey);
                console.log("Decrypted privkey: ", decrypted)
                setStatusText("Unlocked keyring successfully")
                const privKey = await importECDHPrivateKeyFromBase64(decrypted);
                const pubKey = await importECDHPublicKeyFromBase64(pubkey);
                krp?.setPrivKey(privKey);
                krp?.setPubKey(pubKey);
                await saveKey("master", masterKey);
                await saveKey("private", privKey);
                await saveKey("public", pubKey);

                navigate("/", { viewTransition: true })
            } catch (error) {
                console.error("Failed to decrypt private key: ", error)
                setStatusText("Unlock keyring")
                setError("Wrong password")
                setLoading(false);
            }
        } else {
            console.log("No keys: ", encryptedPrivkey, pubkey)
            setLoading(false)
        }
    }

    return <>
        <div className="modal">
            <h2>{statusText}</h2>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={(e) => { e.preventDefault(); unlock(); }}>
                {loading ? <div className="spinner" style={{ marginLeft: "auto", marginRight: "auto" }}></div> : <>
                    <div className="form-group">
                        <label htmlFor="kpass">Keyring password</label>
                        <input autoFocus value={kpass} onChange={(e) => { setKpass(e.target.value) }} type="password" name="kpass" id="kpass" />
                    </div>
                    <button onClick={unlock}>Unlock</button></>}
            </form>
        </div>
    </>
}

export default UnlockPage;