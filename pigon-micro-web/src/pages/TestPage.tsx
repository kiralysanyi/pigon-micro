import { useEffect, useState } from "react";
import { deriveSharedKey, generateECDHKeyPair, encrypt, decrypt, exportKeyToString } from "../lib/encryption/ecdh";

const enc = new TextEncoder();
const dec = new TextDecoder();



const TestPage = () => {

    const [encryptInput, setEncryptInput] = useState("");
    const [decryptInput, setDecryptInput] = useState("");

    const [encryptOutput, setEncryptOutput] = useState("");
    const [decryptOutput, setDecryptOutput] = useState("");

    const [aPair, setaPair] = useState<CryptoKeyPair>();
    const [bPair, setbPair] = useState<CryptoKeyPair>();

    const [aShared, setaShared] = useState<string>();
    const [bShared, setbShared] = useState<string>();


    const onEncrypt = async () => {
        if (aShared) {
            setEncryptOutput(JSON.stringify(await encrypt(encryptInput, aShared)))
        }
    }

    const onDecrypt = async () => {
        if (bShared) {
            try {
                setDecryptOutput(await decrypt(JSON.parse(decryptInput), bShared))
            } catch (error) {
                console.error(error)
            }
        }
    }

    const genKeyPairs = async () => {
        console.log("Generate keypairs")
        const a = await generateECDHKeyPair();
        const b = await generateECDHKeyPair();
        setaPair(a);
        setbPair(b);

        console.log("Generate shared keys")

        const as = await deriveSharedKey(a.privateKey, b.publicKey);
        const bs = await deriveSharedKey(b.privateKey, a.publicKey);

        setaShared(await exportKeyToString(as));
        setbShared(await exportKeyToString(bs));

    }

    const [aKeyStr, setaKeyStr] = useState("");
    const [bKeyStr, setbKeyStr] = useState("");

    useEffect(() => {
        (async () => {
            let akeys = "";
            let bkeys = "";

            if (aPair) {
                akeys += dec.decode(await crypto.subtle.exportKey("pkcs8", aPair.privateKey))
                akeys += ":"
                akeys += dec.decode(await crypto.subtle.exportKey("spki", aPair.publicKey))
                setaKeyStr(akeys)
            }

            if (bPair) {
                bkeys += dec.decode(await crypto.subtle.exportKey("pkcs8", bPair.privateKey))
                bkeys += ":"
                bkeys += dec.decode(await crypto.subtle.exportKey("spki", bPair.publicKey))
                setbKeyStr(bkeys)
            }

            console.log(akeys, bkeys)

        })()
    }, [aPair, bPair])

    useEffect(() => {
        genKeyPairs();

        return () => { }
    }, [])

    return <>
        <h1>Encryption test page</h1>
        <button onClick={genKeyPairs}>Generate keypairs</button>
        <div className="test_content">
            <div>
                <h1>A</h1>
                <p>Shared key: <span>{aShared}</span></p>
                <p>Private key: {aKeyStr.split(":")[0]}</p>
                <p>Public key: {aKeyStr.split(":")[1]}</p>
                <input type="text" placeholder="Text to encrypt" value={encryptInput} onChange={(ev) => { setEncryptInput(ev.target.value) }} />
                <p>Out: <span>{encryptOutput}</span></p>
                <button onClick={onEncrypt}>Encrypt</button>
            </div>
            <div>
                <h1>B</h1>
                <p>Shared key: <span>{bShared}</span></p>
                <p>Private key: {bKeyStr.split(":")[0]}</p>
                <p>Public key: {bKeyStr.split(":")[1]}</p>

                <input type="text" placeholder="Text to decrypt" value={decryptInput} onChange={(ev) => { setDecryptInput(ev.target.value) }} />
                <p>Out: <span>{decryptOutput}</span></p>
                <button onClick={onDecrypt}>Decrypt</button>
            </div>
        </div>
    </>
}

export default TestPage;