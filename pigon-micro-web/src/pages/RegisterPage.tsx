import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { BASEURL } from "../conf";

const RegisterPage = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [password1, setPassword1] = useState("");

    const [inputsDisabled, setInputsDisabled] = useState(false);
    const [error, setError] = useState<string>();

    const navigate = useNavigate();

    const register = () => {
        setInputsDisabled(true);
        if (password !== password1) {
            setError("Password mismatch");
            setInputsDisabled(false);
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long");
            setInputsDisabled(false);
            return;
        }

        if (username.length < 5) {
            setError("Username must be at least 5 characters long");
            setInputsDisabled(false);
            return;
        }

        setError(undefined);

        axios.post(BASEURL + "/auth/register", {
            username,
            password
        }).then((response) => {
            if (response.status == 201) {
                setError(undefined);
                console.log("Created user, navigating");
                navigate("/login");
            }
        }).catch((error) => {
            console.error(error);
            setError("Failed to create user");
            setInputsDisabled(false);
        })
    }

    return <>
        <div className="modal">
            <h1>Register</h1>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={(e) => { e.preventDefault(); register(); }}>

                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input disabled={inputsDisabled} value={username} onChange={(e) => { setUsername(e.target.value) }} type="text" id="username" name="username" />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input disabled={inputsDisabled} value={password} onChange={(e) => { setPassword(e.target.value) }} type="password" id="password" name="password" />
                </div>

                <div className="form-group">
                    <label htmlFor="password1">Confirm password</label>
                    <input disabled={inputsDisabled} value={password1} onChange={(e) => { setPassword1(e.target.value) }} type="password" id="password1" name="password1" />
                </div>

                <button onClick={register} disabled={inputsDisabled}>Register</button>
                {(inputsDisabled == false) && <Link to="/login">Login instead</Link>}
            </form>
        </div>
    </>
}

export default RegisterPage;