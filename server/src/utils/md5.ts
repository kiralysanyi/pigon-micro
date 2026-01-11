import {hash} from "node:crypto"

const md5 = (text: string): string => {
    return hash("MD5", Buffer.from(text))
}

export default md5;