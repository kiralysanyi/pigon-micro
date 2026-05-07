import { createContext, useEffect, useState } from "react"

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



    useEffect(() => {
        if (!masterKey || !privKey || !pubKey) {
            if (location.pathname != "/unlock") {
                location.replace("/unlock");   
            }
        }
    }, [])

    return <KeyRingContext value={{ masterKey, setMasterKey, privKey, pubKey, setPrivKey, setPubKey }}>
        {children}
    </KeyRingContext>
}

export { KeyRingProvider, KeyRingContext };
export type { krcDat }