import { useParams } from "react-router";

const ChatPage = () => {
    const params = useParams();
    return <div style={{paddingTop: "5rem"}}>
    <h1>Chat: {params.id}</h1>
    </div>
}

export default ChatPage;