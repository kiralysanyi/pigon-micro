import getMasterKey from "./getMasterKey";
import uploadMasterKey from "./uploadMasterKey";

const changeKeyringPass = async (old_password: string, new_password: string) => {
    const mKey = await getMasterKey(old_password, true);
    await uploadMasterKey(mKey, new_password);
}


export default changeKeyringPass;