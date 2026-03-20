import { ArrowLeftCircleIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router";

const AccountPage = () => {
    const navigate = useNavigate();
    return <>
        <div className="modal">
            <button onClick={() => navigate("/")}>
                <ArrowLeftCircleIcon width={24} height={24}/>
                <span>Go back</span>
            </button>
            <h1>Account Settings</h1>
        </div>
    </>
}

export default AccountPage;