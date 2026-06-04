import { createContext, useEffect, useState } from "react"
import { getKey } from "../lib/indexedDB/keyDB";

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
    const [isLoading, setIsLoading] = useState(true);

    // load keys from db
    useEffect(() => {
        (async () => {
            try {
                const mKey = await getKey("master");
                const privKey = await getKey("private");
                const pubKey = await getKey("public");
                setMasterKey(mKey);
                setPrivKey(privKey);
                setPubKey(pubKey);
                console.log("Keys loaded", mKey, privKey, pubKey)
                setIsLoading(false)
            } catch (error) {
                console.log("Failed to get keys from db: ", error);
                setIsLoading(false);
            }
        })()
    }, [])

    useEffect(() => {
        if (isLoading == true) {
            return
        }
        if (!masterKey || !privKey || !pubKey) {
            console.log("Redirecting to unlock", masterKey, privKey, pubKey)
            if (location.pathname != "/unlock" && location.pathname != "/login" && location.pathname != "/register") {
                location.replace("/unlock");
            }
        }
    }, [isLoading, masterKey, privKey, pubKey])

    return <KeyRingContext value={{ masterKey, setMasterKey, privKey, pubKey, setPrivKey, setPubKey }}>
        {children}
    </KeyRingContext>
}

export { KeyRingProvider, KeyRingContext };
export type { krcDat }