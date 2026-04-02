import { ArrowLeftCircleIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router";
import { BASEURL } from "../conf";
import { useEffect, useState } from "react";
import type { userdata } from "../types/userdata";
import getUserInfo from "../lib/auth/getUserInfo";
import uploadPfp from "../lib/auth/uploadPfp";

const AccountPage = () => {
    const navigate = useNavigate();

    const [userinfo, setUserInfo] = useState<userdata>();

    useEffect(() => {
        getUserInfo().then((info) => {
            setUserInfo(info)
        })
    })

    return <>
        <div className="modal">
            <button onClick={() => navigate("/")}>
                <ArrowLeftCircleIcon width={24} height={24} />
                <span>Go back</span>
            </button>
            <h1>Account Settings</h1>
            {userinfo && <h2>Logged in as: <strong>{userinfo.username}</strong></h2>}
            <h3>Profile picture</h3>
            {userinfo && <>
                <img className="ap-pfp" src={`${BASEURL}/auth/pfp/${userinfo.ID}`} alt="pfp" />
                <button onClick={async () => {await uploadPfp(); location.reload();}}>Change Profile Picture</button>
            </>}
        </div>
    </>
}

export default AccountPage;