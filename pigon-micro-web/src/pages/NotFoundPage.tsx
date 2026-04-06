import { useNavigate } from "react-router";

const NotFoundPage = () => {
    const navigate = useNavigate();

    return <>
    <div className="modal">
        <h1>Page not found</h1>
        <button onClick={() => navigate("/", {viewTransition: true})}>Return to home</button>
    </div>
    </>
}

export default NotFoundPage;