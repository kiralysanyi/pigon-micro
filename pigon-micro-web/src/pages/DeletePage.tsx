import { useEffect, useState } from "react";
import type { userdata } from "../types/userdata";
import getUserInfo from "../lib/auth/getUserInfo";
import { toast } from "react-toastify";
import api from "../services/apiservice";
import { clearKeys } from "../lib/indexedDB/keyDB";
import { useNavigate } from "react-router";

const DeletePage = () => {
    const [userinfo, setUserinfo] = useState<userdata>()
    useEffect(() => {
        setShowSpinner(true)
        getUserInfo().then((data) => {
            setUserinfo(data);
            setShowSpinner(false)
        })
    }, [])

    const navigate = useNavigate();
    const [showSpinner, setShowSpinner] = useState(false);
    const [password, setPassword] = useState("");

    const deleteAcc = async () => {
        setShowSpinner(true);
        toast.info("Deleting account, please wait.");
        try {
            const response = await api.post("/auth/delaccount", { password });
            if (response.status == 200) {
                toast.info("Account deleted successfully, we hope you had a great time here!");
                localStorage.clear();
                await clearKeys();
                sessionStorage.clear();
                setTimeout(() => {
                    navigate("/login");
                }, 5000);
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to delete account.");
            if (error.response) {
                console.error(error.response)
                if (error.response.data) {
                    toast.error(error.response.data.message)
                }
            }
            setShowSpinner(false);
        }
    }


    return <>
        <div className="modal">
            <h1>Delete Account</h1>
            <h2>Username: <strong>{userinfo?.username}</strong></h2>
            <div className="error-msg">Warning! This action is not reversible! It will delete all your data and messages you sent too.</div>
            {showSpinner && <div className="spinner" style={{ marginInline: "auto" }}></div>}
            <form onSubmit={(e) => e.preventDefault()}>
                <label htmlFor="password">Password</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} disabled={showSpinner} type="password" name="password" />
                <button disabled={showSpinner} type="button" onClick={deleteAcc}>Delete account</button>
            </form>
        </div>
    </>
}

export default DeletePage;