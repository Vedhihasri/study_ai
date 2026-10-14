
import React, { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  Clock,
  History,
  Plus,
  RefreshCw,
  MessageCircle,
} from "lucide-react";

import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/common/PageHeader";
import TutorSetup from "../components/tutor/TutorSetup";
import TutorSession from "../components/tutor/TutorSession";

import { getTutorSessions } from "../services/api";
import "../styles/tutor.css";

const Tutor = () => {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [tutorConfig, setTutorConfig] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [showHistory, setShowHistory] = useState(true);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    setHistoryError("");

    try {
      const data = await getTutorSessions();

      const list = Array.isArray(data)
        ? data
        : data.sessions ?? data.items ?? [];

      setSessions(list);
    } catch (error) {
      setHistoryError(
        error.response?.data?.detail ??
          "Unable to load tutor session history."
      );
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleStartSession = (config) => {
    setTutorConfig(config);
    setSessionStarted(true);
    setShowHistory(false);

    // Refresh history when the session is started.
    loadSessions();
  };

  const handleOpenSession = (session) => {
    const config = {
      ...session,
      id: session.id,
      sessionId: session.id,
      topic: session.topic,
      level: session.level,
      style: session.style,
      documentId: session.document_id ?? session.documentId ?? null,
      status: session.status,
    };

    setTutorConfig(config);
    setSessionStarted(true);
    setShowHistory(false);
  };

  const handleEndSession = async () => {
    setSessionStarted(false);
    setTutorConfig(null);
    setShowHistory(true);

    await loadSessions();
  };

  const formatDate = (value) => {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <PageContainer>


      {sessionStarted && tutorConfig ? (
        <div>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                setSessionStarted(false);
                setTutorConfig(null);
                setShowHistory(true);
                loadSessions();
              }}
            >
              <History size={15} className="me-1" />
              Back to sessions
            </button>
          </div>

          <TutorSession
            key={tutorConfig.sessionId ?? tutorConfig.id}
            config={tutorConfig}
            onEndSession={handleEndSession}
          />
        </div>
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">

            <div className="tutor-page-intro">
              <div>
                <h3 className="tutor-page-title">Welcome to your AI Tutor</h3>
                <p className="tutor-page-subtitle">
                  Continue where you left off or start a fresh learning session.
                </p>
              </div>
            </div>


            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={loadSessions}
              disabled={loadingSessions}
            >
              <RefreshCw size={15} className="me-1" />
              {loadingSessions ? "Refreshing..." : "Refresh history"}
            </button>
          </div>

          <section className="tutor-history-section mb-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <h5 className="mb-0">
                <History size={19} className="me-2" />
                Previous sessions
              </h5>

              <button
                type="button"
                className="btn btn-link btn-sm"
                onClick={() => setShowHistory((value) => !value)}
              >
                {showHistory ? "Hide history" : "Show history"}
              </button>
            </div>

            {showHistory && (
              <>
                {historyError && (
                  <div className="alert alert-danger" role="alert">
                    {historyError}
                  </div>
                )}

                {loadingSessions ? (
                  <p className="text-muted">
                    Loading your sessions...
                  </p>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-4">
                    <BookOpen
                      size={34}
                      className="text-muted mb-2"
                    />
                    <h6>No tutoring sessions yet</h6>
                    <p className="text-muted mb-0">
                      Start your first session below. It will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="tutor-history-grid">
                    {sessions.map((session) => {
                      const isEnded = session.status === "ended";

                      return (
                        <article
                          className="tutor-history-card"
                          key={session.id}
                        >
                          <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                            <div className="tutor-history-icon">
                              <MessageCircle size={19} />
                            </div>

                            <span
                              className={`badge ${
                                isEnded
                                  ? "text-bg-secondary"
                                  : "text-bg-success"
                              }`}
                            >
                              {session.status ?? "unknown"}
                            </span>
                          </div>

                          <h6 className="mb-2">
                            {session.topic || "Untitled session"}
                          </h6>

                          <p className="small text-muted mb-2">
                            {session.level || "Level not specified"}
                            {" · "}
                            {session.style || "Default style"}
                          </p>

                          <p className="small text-muted mb-3">
                            <Clock size={14} className="me-1" />
                            {formatDate(session.created_at)}
                          </p>

                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm w-100"
                            onClick={() => handleOpenSession(session)}
                          >
                            {isEnded
                              ? "View conversation"
                              : "Reopen session"}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="tutor-new-session-section">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Plus size={20} />
              <h5 className="mb-0">Start a new session</h5>
            </div>

            <TutorSetup onStart={handleStartSession} />
          </section>
        </>
      )}
    </PageContainer>
  );
};

export default Tutor;
