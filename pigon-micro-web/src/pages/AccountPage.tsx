import { ArrowLeftCircleIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router";
import { BASEURL } from "../conf";
import { useEffect, useState } from "react";
import type { userdata } from "../types/userdata";
import getUserInfo from "../lib/auth/getUserInfo";
import uploadPfp from "../lib/auth/uploadPfp";
import GlassButton from "../components/GlassButton";
import api from "../services/apiservice";
import { toast } from "react-toastify";
import changeKeyringPass from "../lib/encryption/changeKeyringPass";

const AccountPage = () => {
    const navigate = useNavigate();

    const [userinfo, setUserInfo] = useState<userdata>();
    const [oldPass, setOldPass] = useState<string>("");
    const [newPass, setNewPass] = useState<string>("");
    const [newPassC, setNewPassC] = useState<string>("");

    const [oldKPass, setOldKPass] = useState<string>("");
    const [newKpass, setNewKPass] = useState<string>("");
    const [newKPassC, setNewKPassC] = useState<string>("");

    const changePass = async () => {
        console.log(oldPass, newPass, newPassC)
        if (oldPass?.trim() === "" || newPass?.trim() === "" || newPassC?.trim() === "") {
            return;
        }

        if (newPassC != newPass) {
            toast.error("Password mismatch, check again");
            return;
        }

        if (newPass == oldPass) {
            toast.error("Old password and new password should not match");
            return;
        }

        try {
            const response = await api.post("/auth/password", { old_password: oldPass, new_password: newPass });
            if (response.status == 200) {
                toast.info("Password changed successfully, you have been logged out on all of your devices.");
                return;
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to update password!");
        }
    }

    const changeKPass = async () => {
        if (oldKPass.trim() === "" || newKpass.trim() === "" || newKPassC.trim() === "") {
            return;
        }

        if (newKpass !== newKPassC) {
            toast.error("Password mismatch, check again");
            return;
        }

        if (oldKPass === newKpass) {
            toast.error("Old password and new password should not match!");
            return
        }

        if (newKpass.length < 12) {
            toast.error("Keyring password should be at least 12 characters long!");
            return
        }

        try {
            await changeKeyringPass(oldKPass, newKpass)
            toast.info("Changed keyring password successfully!")
        } catch (error) {
            console.error(error);
            toast.error("Failed to change keyring password.")
        }
    }

    useEffect(() => {
        getUserInfo().then((info) => {
            setUserInfo(info)
        })
    }, [])

    const setPfp = () => {
        uploadPfp().then(() => {
            location.reload();
        }).catch((error) => {
            window.dispatchEvent(new CustomEvent("api:error", { detail: { message: error } }));
        })
    }

    return <>
        <div className="modal">
            <GlassButton className="backbutton" onClick={() => navigate("/", { viewTransition: true })}>
                <ArrowLeftCircleIcon width={24} height={24} />
            </GlassButton>
            <h1>Account Settings</h1>
            {userinfo && <h2>Logged in as: <strong>{userinfo.username}</strong></h2>}
            <h3>Profile picture</h3>
            {userinfo && <>
                <img className="ap-pfp" src={`${BASEURL}/auth/pfp/${userinfo.ID}`} alt="pfp" />
                <button onClick={setPfp}>Change Profile Picture</button>
                <button onClick={() => navigate("/account/sessions")}>Manage sessions</button>
                <form onSubmit={(e) => e.preventDefault()} style={{ border: "1px solid gray", borderRadius: "1rem", backgroundColor: "darkslategrey", padding: "1rem" }}>
                    <h2>Change Password</h2>
                    <label htmlFor="old-password">Current password</label>
                    <input value={oldPass} onChange={(e) => setOldPass(e.target.value)} type="password" name="old-password" />
                    <label htmlFor="password">New Password</label>
                    <input value={newPass} onChange={(e) => setNewPass(e.target.value)} type="password" name="password" />
                    <label htmlFor="password1">Confirm New Password</label>
                    <input value={newPassC} onChange={(e) => setNewPassC(e.target.value)} type="password" name="password1" />
                    <button type="button" onClick={changePass}>Change Password</button>
                </form>
                <form onSubmit={(e) => e.preventDefault()} style={{ border: "1px solid gray", borderRadius: "1rem", backgroundColor: "darkslategrey", padding: "1rem" }}>
                    <div className="error-msg">
                        <b>Warning! If you forget your keyring password you will not be able to access any previous messages!!!</b>
                        <br />
                        <span>You have been warned.</span>
                    </div>
                    <h2>Change Keyring Password</h2>
                    <label htmlFor="old-kpassword">Current password</label>
                    <input value={oldKPass} onChange={(e) => setOldKPass(e.target.value)} type="password" name="old-kpassword" />
                    <label htmlFor="kpassword">New Password</label>
                    <input type="password" name="kpassword" value={newKpass} onChange={(e) => setNewKPass(e.target.value)} />
                    <label htmlFor="kpassword1">Confirm New Password</label>
                    <input type="password" name="kpassword1" value={newKPassC} onChange={(e) => setNewKPassC(e.target.value)} />
                    <button type="button" onClick={changeKPass}>Change Keyring Password</button>
                </form>
                <button onClick={() => navigate("/account/delete")} className="redbutton">Delete Account</button>
            </>}
            <p>
                pigon-micro by Király Sándor
                <br />
                <a href="https://github.com/kiralysanyi/pigon-micro" target="blank">Source</a>
            </p>
        </div>
    </>
}

export default AccountPage;