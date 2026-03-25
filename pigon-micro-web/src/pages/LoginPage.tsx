import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { BASEURL } from "../conf";

const LoginPage = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [inputsDisabled, setInputsDisabled] = useState(false);
    const [error, setError] = useState<string>();
    const navigate = useNavigate();

    const login = () => {
        setInputsDisabled(true);
        if (username === "" || password === "") {
            setError("No input fields should be empty")
            setInputsDisabled(false);
            return;
        }

        axios.post(BASEURL + "/auth/login", {
            username,
            password
        }).then((response) => {
            if (response.status == 200) {
                localStorage.setItem("atoken", response.data.token);
                localStorage.setItem("atokenExpire", response.data.tokenExpire);
                localStorage.setItem("rtoken", response.data.refreshToken);
                localStorage.setItem("rtokenExpire", response.data.refreshTokenExpire);
                console.log("Logged in successfully: ", response.data);
                navigate("/")
            } else {
                console.log(response.status)
            }
        }).catch((error) => {
            setInputsDisabled(false);
            console.error(error.response.data.error);
            setError(error.response.data.error)
        })
    }

    return <>
        <div className="modal">
            <h1>Login</h1>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={(e) => {e.preventDefault(); login();}}>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input disabled={inputsDisabled} value={username} onChange={(e) => { setUsername(e.target.value) }} type="text" id="username" name="username" />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input disabled={inputsDisabled} value={password} onChange={(e) => { setPassword(e.target.value) }} type="password" id="password" name="password" />
                </div>

                <button disabled={inputsDisabled} onClick={login}>Login</button>
                {(inputsDisabled == false) && <Link to="/register">Register instead</Link>}
            </form>
        </div>
    </>
}

export default LoginPage;