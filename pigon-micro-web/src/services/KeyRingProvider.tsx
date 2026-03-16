import { createContext, useEffect, useState } from "react"
import { exportMasterToBase64, importMasterFromBase64 } from "../lib/encryption/masterkey";

const KeyRingContext = createContext<{ masterKey: CryptoKey | undefined, setMasterKey: React.Dispatch<React.SetStateAction<CryptoKey | undefined>> } | undefined>(undefined)

const KeyRingProvider = ({ children }: React.PropsWithChildren) => {
    const [masterKey, setMasterKey] = useState<CryptoKey>();

    const [lockSave, setLockSave] = useState(true)
    useEffect(() => {
        const saved = sessionStorage.getItem("mKey")
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

    return <KeyRingContext value={{ masterKey, setMasterKey }}>
        {children}
    </KeyRingContext>
}

export { KeyRingProvider, KeyRingContext }