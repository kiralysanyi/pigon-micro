import axios from "axios";
import { useEffect, useState } from "react";
import { BASEURL } from "../conf";
import getAccessToken from "../lib/auth/getAccessToken";
import { decodeEncryptedData } from "../lib/encryption/utils";
import { decrypt } from "../lib/encryption/ecdh";
import { useNavigate } from "react-router";

const UnlockPage = () => {
    const [loading, setLoading] = useState(true);
    const [statusText, setStatusText] = useState("Fetching keys");
    const [error, setError] = useState<string>()
    const [encryptedPrivkey, setEncryptedPrivkey] = useState<string>();
    const [pubkey, setPubkey] = useState<string>();
    const [kpass, setKpass] = useState("");

    const navigate = useNavigate()

    useEffect(() => {
        getAccessToken().then((token) => {
            // get private key
            axios.get(BASEURL + "/api/v1/keyring/privkey", { headers: { Authorization: `Bearer ${token}` } }).then((response) => {
                console.log("Got private key")
                setEncryptedPrivkey(response.data.data.encryptedPrivKey);

                // get public key
                axios.get(BASEURL + "/api/v1/keyring/pubkey", { headers: { Authorization: `Bearer ${token}` } }).then((response) => {
                    console.log("Got public key")
                    setPubkey(response.data.data.pubKey);
                    setLoading(false);
                    setStatusText("Unlock keyring")
                })
            })
        }).catch(() => {
            //access token error, redirect to login
            navigate("/login")
        })
    }, []);

    const unlock = () => {
        setError(undefined)
        setLoading(true);
        if (encryptedPrivkey && pubkey) {
            const epkeyData = decodeEncryptedData(encryptedPrivkey);
            decrypt(epkeyData, kpass).then(async (decrypted) => {
                console.log("Decrypted privkey: ", decrypted)
                setStatusText("Unlocked keyring successfully")

                sessionStorage.setItem("privKey", decrypted);
                sessionStorage.setItem("pubKey", pubkey);

                // get rsa keys

                axios.get(BASEURL + "/api/v1/keyring/rsa/keys", { headers: { Authorization: `Bearer: ${await getAccessToken()}` } }).then(async (response) => {
                    if (response.status == 200) {
                        const pubRsaKey = response.data.keys.public;
                        const privRsaKey = response.data.keys.private;
                        const decryptedPrivateKey = await decrypt(decodeEncryptedData(privRsaKey), kpass)
                        sessionStorage.setItem("privRsa", decryptedPrivateKey);
                        sessionStorage.setItem("pubRsa", pubRsaKey)
                    }
                }).catch((err) => {
                    console.error("Failed to get rsa keys: ", err)
                })

                navigate("/")
            }).catch((error) => {
                console.error("Failed to decrypt private key: ", error)
                setStatusText("Unlock keyring")
                setError("Wrong password")
                setLoading(false);
            })
        } else {
            console.log("No keys: ", encryptedPrivkey, pubkey)
            setLoading(false)
        }
    }

    return <>
        <div className="modal">
            <h2>{statusText}</h2>
            {error && <div className="error-msg">{error}</div>}
            {loading ? <div className="spinner" style={{ marginLeft: "auto", marginRight: "auto" }}></div> : <>
                <div className="form-group">
                    <label htmlFor="kpass">Keyring password</label>
                    <input value={kpass} onChange={(e) => { setKpass(e.target.value) }} type="password" name="kpass" id="kpass" />
                </div>
                <button onClick={unlock}>Unlock</button></>}
        </div>
    </>
}

export default UnlockPage;