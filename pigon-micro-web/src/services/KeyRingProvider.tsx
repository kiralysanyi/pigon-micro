import { createContext, useEffect, useState } from "react"
import { exportMasterToBase64, importMasterFromBase64 } from "../lib/encryption/masterkey";
import { importECDHPrivateKeyFromBase64, importECDHPublicKeyFromBase64 } from "../lib/encryption/utils";

interface krcDat {
    masterKey: CryptoKey | undefined,
    setMasterKey: React.Dispatch<React.SetStateAction<CryptoKey | undefined>>,
    privKey: CryptoKey | undefined,
    pubKey: CryptoKey | undefined,
    setPrivKey: React.Dispatch<React.SetStateAction<CryptoKey | undefined>>,
    setPubKey: React.Dispatch<React.SetStateAction<CryptoKey | undefined>>
}

const KeyRingContext = createContext<krcDat | undefined>(undefined)

const KeyRingProvider = ({ children }: React.PropsWithChildren) => {
    const [masterKey, setMasterKey] = useState<CryptoKey>();
    const [privKey, setPrivKey] = useState<CryptoKey>();
    const [pubKey, setPubKey] = useState<CryptoKey>();

    const [lockSave, setLockSave] = useState(true)
    useEffect(() => {
        const saved = sessionStorage.getItem("mKey")
        const savedPrivKey = sessionStorage.getItem("privKey");
        const savedPubKey = sessionStorage.getItem("pubKey");
        console.log(savedPrivKey, savedPubKey)
        if (savedPrivKey != null && savedPubKey != null) {
            importECDHPrivateKeyFromBase64(savedPrivKey).then((key) => {
                setPrivKey(key);
                console.log("KRP: private key loaded")
            })

            importECDHPublicKeyFromBase64(savedPubKey).then((key) => {
                setPubKey(key);
                console.log("KRP: public key loaded")
            })
        }

        if (saved) {
            importMasterFromBase64(saved).then((mKey) => {
                setMasterKey(mKey)
                setLockSave(false)
            })
        } else {
            setLockSave(false)
        }
    }, [])

    useEffect(() => {
        if (lockSave || masterKey == undefined) {
            return;
        }

        exportMasterToBase64(masterKey).then((mKey) => {
            sessionStorage.setItem("mKey", mKey)
        })
    }, [lockSave, masterKey])

    return <KeyRingContext value={{ masterKey, setMasterKey, privKey, pubKey, setPrivKey, setPubKey }}>
        {children}
    </KeyRingContext>
}

export { KeyRingProvider, KeyRingContext };
export type { krcDat }