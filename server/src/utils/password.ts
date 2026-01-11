import * as bcrypt from "bcrypt";
const saltRounds = 10;

const hashPass = (password: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(saltRounds, (err, salt) => {
            if (err) {
                console.error("Bcrypt gensalt error: ", err)
                return reject(err);
            }
            bcrypt.hash(password, salt, (err, hash) => {
                if (err) {
                    console.error("Bcrypt hash error: ", err)
                    return reject(err)
                }

                resolve(hash)
            });
        });
    });
}

const verifyPass = (password: string, passwordHash: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, passwordHash, (err, result) => {
            if (err) {
                console.error("Bcrypt verify error: ", err)
                return reject(err);
            }

            resolve(result);
        })
    })
}


export { hashPass, verifyPass };