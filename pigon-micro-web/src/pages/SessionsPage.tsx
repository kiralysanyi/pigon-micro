import { useEffect, useState } from "react";
import type { Session } from "../types/Session";
import api from "../services/apiservice";
import { useNavigate } from "react-router";
import { ArrowLeftCircleIcon } from "@heroicons/react/24/outline";
import GlassButton from "../components/GlassButton";
import formatMsgDate from "../lib/formatMsgDate";
import { toast } from "react-toastify";

const SessionsPage = () => {
    const [sessions, setSessions] = useState<Session[]>([])
    const navigate = useNavigate();
    const [showSpinner, setShowSpinner] = useState(false);

    const reloadList = () => {
        setShowSpinner(true)
        api.get("/auth/sessions").then((response) => {
            setShowSpinner(false)
            setSessions(response.data.sessions);
        })
    }

    useEffect(() => {
        reloadList();
    }, [])

    const delSession = async (sessionId: number) => {
        try {
            setShowSpinner(true)
            await api.delete(`/auth/sessions/${sessionId}`);
            toast.info("Session deleted!");
            setShowSpinner(false);
            reloadList();
        } catch (error) {
            setShowSpinner(false);
        }
    }

    return <>
        <div className="modal">
            <GlassButton className="backbutton" onClick={() => navigate("/account", { viewTransition: true })}>
                <ArrowLeftCircleIcon width={24} height={24} />
            </GlassButton>
            <h1>Sessions</h1>
            {showSpinner && <div className="spinner"></div>}
            <button onClick={reloadList}>Refresh</button>
            <div className="modal-list">
                {sessions.map((session) => <div className="list-element">
                    <span>ID: {session.id}</span>
                    <span>Expires at: {formatMsgDate(new Date(session.refreshTokenExpire))}</span>
                    <button className="redbutton" onClick={() => delSession(session.id)}>Delete</button>
                </div>)}
            </div>
        </div>
    </>
}

export default SessionsPage;