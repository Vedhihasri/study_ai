
import React, { useEffect, useState } from "react";
import {
  Brain,
  Send,
  Lightbulb,
  CheckCircle,
  BookOpen,
  RotateCcw,
} from "lucide-react";

import {
  getTutorSession,
  sendTutorMessage,
  endTutorSession,
  getTutorHint,
  generateTutorQuickCheck,
  submitTutorQuickCheck,
} from "../../services/api";

import TutorMessage from "./TutorMessage";
import TutorQuestion from "./TutorQuestion";

const TutorSession = ({ config, onEndSession }) => {
  const sessionId = config?.sessionId ?? config?.id;

  const [answer, setAnswer] = useState("");
  const [hintShown, setHintShown] = useState(false);
  const [messages, setMessages] = useState([]);
  const [sources, setSources] = useState([]);

  const [loadingHint, setLoadingHint] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [chatError, setChatError] = useState("");

  const [quickCheck, setQuickCheck] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [quickCheckLoading, setQuickCheckLoading] = useState(false);
  const [quickCheckError, setQuickCheckError] = useState("");
  const [quickCheckResult, setQuickCheckResult] = useState(null);

  // Load saved conversation history.
  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      if (!sessionId) {
        setChatError("No tutoring session ID was provided.");
        setLoadingHistory(false);
        return;
      }

      setLoadingHistory(true);
      setChatError("");

      try {
        const session = await getTutorSession(sessionId);

        if (cancelled) return;

        const history = (session.messages ?? [])
          .filter(
            (message) =>
              message.message_type !== "quick_check" &&
              message.type !== "quick_check"
          )
          .map((message) => ({
            id: message.id,
            role: message.role,
            type: message.message_type ?? message.type ?? "text",
            content: message.content,
          }));

        setMessages(history);
      } catch (err) {
        if (!cancelled) {
          setChatError(
            err.response?.data?.detail ??
              "Unable to load the tutoring conversation."
          );
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Send a message to the AI tutor.
  const sendAnswer = async () => {
    const text = answer.trim();

    if (!text || sending || loadingHistory || !sessionId || ending) {
      return;
    }

    setSending(true);
    setChatError("");
    setAnswer("");

    const temporaryId = `temp-${Date.now()}`;

    setMessages((previous) => [
      ...previous,
      {
        id: temporaryId,
        role: "user",
        type: "text",
        content: text,
      },
    ]);

    try {
      const result = await sendTutorMessage(sessionId, text);
      const userMessage = result.user_message ?? result.userMessage;
      const assistantMessage =
        result.assistant_message ?? result.assistantMessage;

      const assistantContent =
        assistantMessage?.content ??
        result.answer ??
        result.response ??
        result.content;

      if (!assistantContent) {
        throw new Error("The server did not return an AI response.");
      }

      setMessages((previous) => [
        ...previous.filter((message) => message.id !== temporaryId),
        {
          id: userMessage?.id ?? temporaryId,
          role: "user",
          type: "text",
          content: userMessage?.content ?? text,
        },
        {
          id: assistantMessage?.id ?? `assistant-${Date.now()}`,
          role: "assistant",
          type: "text",
          content: assistantContent,
        },
      ]);

      setSources(result.sources ?? assistantMessage?.sources ?? []);
    } catch (err) {
      setMessages((previous) =>
        previous.filter((message) => message.id !== temporaryId)
      );

      setChatError(
        err.response?.data?.detail ??
          err.message ??
          "Unable to send your message. Please try again."
      );

      setAnswer(text);
    } finally {
      setSending(false);
    }
  };

  // Get a hint from the AI tutor.
  const showHint = async () => {
    if (hintShown || loadingHint || !sessionId || ending) return;

    setLoadingHint(true);
    setChatError("");

    try {
      const result = await getTutorHint(sessionId);

      if (!result?.hint) {
        throw new Error("The tutor did not return a hint.");
      }

      setMessages((previous) => [
        ...previous,
        {
          id: `hint-${Date.now()}`,
          role: "assistant",
          type: "hint",
          content: result.hint,
        },
      ]);

      setSources(result.sources ?? []);
      setHintShown(true);
    } catch (err) {
      setChatError(
        err.response?.data?.detail ??
          err.message ??
          "Unable to generate a hint. Please try again."
      );
    } finally {
      setLoadingHint(false);
    }
  };

  // Generate a question from the user's study material.
  const handleGenerateQuickCheck = async () => {
    if (!sessionId || quickCheckLoading || ending) return;

    setQuickCheckLoading(true);
    setQuickCheckError("");
    setQuickCheck(null);
    setQuickCheckResult(null);
    setSelectedAnswer("");
    setSubmitted(false);

    try {
      const data = await generateTutorQuickCheck(sessionId);

      if (!data?.question || !data?.options || !data?.question_id) {
        throw new Error("The server returned an incomplete question.");
      }

      const options = Object.entries(data.options).map(([id, text]) => ({
        id: id.toUpperCase(),
        text,
      }));

      if (
        options.length !== 4 ||
        !["A", "B", "C", "D"].every((id) =>
          options.some((option) => option.id === id)
        )
      ) {
        throw new Error("The server did not return four valid options.");
      }

      setQuickCheck({
        questionId: data.question_id,
        question: data.question,
        options,
      });
    } catch (err) {
      setQuickCheckError(
        err.response?.data?.detail ??
          err.message ??
          "Unable to generate a question. Please try again."
      );
    } finally {
      setQuickCheckLoading(false);
    }
  };

  // Submit the selected answer for backend evaluation.
  const handleSubmitQuickCheck = async () => {
    if (
      !quickCheck ||
      !selectedAnswer ||
      submitted ||
      quickCheckLoading ||
      ending
    ) {
      return;
    }

    setQuickCheckLoading(true);
    setQuickCheckError("");

    try {
      const result = await submitTutorQuickCheck(
        sessionId,
        quickCheck.questionId,
        selectedAnswer
      );

      setQuickCheckResult(result);
      setSubmitted(true);
    } catch (err) {
      setQuickCheckError(
        err.response?.data?.detail ??
          "Unable to submit your answer. Please try again."
      );
    } finally {
      setQuickCheckLoading(false);
    }
  };

  // End the session in the backend.
  const handleEndSession = async () => {
    if (ending || !sessionId) return;

    setEnding(true);
    setChatError("");

    try {
      await endTutorSession(sessionId);
      onEndSession();
    } catch (err) {
      setChatError(
        err.response?.data?.detail ??
          "Unable to end the session. Please try again."
      );
    } finally {
      setEnding(false);
    }
  };

  // Reset local controls without deleting saved conversation history.
  const resetSession = () => {
    setAnswer("");
    setHintShown(false);
    setSelectedAnswer("");
    setSubmitted(false);
    setQuickCheck(null);
    setQuickCheckResult(null);
    setQuickCheckError("");
    setChatError("");
    setSources([]);
  };

  const userMessageCount = messages.filter(
    (message) => message.role === "user"
  ).length;

  const progress = !submitted
    ? 0
    : quickCheckResult?.is_correct
      ? 100
      : 50;

  return (
    <div className="tutor-session">
      <div className="tutor-session-header">
        <div>
          <div className="d-flex align-items-center gap-2">
            <Brain size={22} />
            <h4 className="mb-0">AI Tutor</h4>
          </div>

          <small className="text-muted">
            {config.topic} · {config.level} · {config.style}
          </small>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={handleEndSession}
          disabled={ending || loadingHistory || sending}
        >
          {ending ? "Ending..." : "End Session"}
        </button>
      </div>

      <div className="tutor-session-layout">
        <aside className="tutor-learning-panel">
          <h6>Learning Context</h6>

          <div className="tutor-context-item">
            <span>Topic</span>
            <strong>{config.topic}</strong>
          </div>

          <div className="tutor-context-item">
            <span>Study material</span>
            <strong>
              {config.documentId
                ? `Document #${config.documentId}`
                : "All available documents"}
            </strong>
          </div>

          <div className="tutor-context-item">
            <span>Level</span>
            <strong className="text-capitalize">{config.level}</strong>
          </div>

          <hr />

          <h6>Learning approach</h6>

          <div className="tutor-concept completed">
            <CheckCircle size={16} />
            Guided conversation
          </div>

          <div className="tutor-concept">
            <BookOpen size={16} />
            Learn through examples
          </div>
        </aside>

        <main className="tutor-chat-panel">
          <div className="tutor-conversation">
            {loadingHistory ? (
              <p className="text-muted">Loading conversation...</p>
            ) : messages.length === 0 ? (
              <p className="text-muted">
                Start learning by asking a question about your topic.
              </p>
            ) : (
              messages.map((message) => (
                <TutorMessage key={message.id} message={message} />
              ))
            )}

            {sending && (
              <p className="text-muted">AI Tutor is thinking...</p>
            )}

            {chatError && (
              <div className="alert alert-danger mt-2" role="alert">
                {chatError}
              </div>
            )}

            {sources.length > 0 && (
              <div className="mt-3">
                <h6>Sources</h6>

                {sources.map((source, index) => (
                  <div
                    className="small text-muted mb-1"
                    key={source.id ?? index}
                  >
                    {typeof source === "string"
                      ? source
                      : source.filename ??
                        source.document_name ??
                        source.title ??
                        source.content ??
                        `Source ${index + 1}`}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="tutor-tools">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={showHint}
              disabled={
                hintShown ||
                loadingHint ||
                loadingHistory ||
                sending ||
                ending
              }
            >
              <Lightbulb size={15} className="me-1" />
              {loadingHint
                ? "Generating hint..."
                : hintShown
                  ? "Hint shown"
                  : "Get a hint"}
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={resetSession}
              disabled={loadingHistory || sending || ending}
            >
              <RotateCcw size={15} className="me-1" />
              Reset controls
            </button>
          </div>

          {/* QUICK CHECK: between tutor tools and chat input */}
          <section className="tutor-question-wrapper">
            <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-3">
              <h6 className="mb-0">Quick Knowledge Check</h6>

              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={handleGenerateQuickCheck}
                disabled={
                  quickCheckLoading ||
                  loadingHistory ||
                  sending ||
                  ending
                }
              >
                {quickCheckLoading && !submitted
                  ? "Generating..."
                  : "Generate Question"}
              </button>
            </div>

            {quickCheckError && (
              <div className="alert alert-danger mt-2" role="alert">
                {quickCheckError}
              </div>
            )}

            {quickCheck && (
              <>
                <TutorQuestion
                  question={quickCheck}
                  selectedAnswer={selectedAnswer}
                  onSelect={setSelectedAnswer}
                  submitted={submitted}
                />

                {!submitted && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm mt-3"
                    onClick={handleSubmitQuickCheck}
                    disabled={
                      !selectedAnswer ||
                      quickCheckLoading ||
                      ending
                    }
                  >
                    {quickCheckLoading
                      ? "Checking..."
                      : "Submit Answer"}
                  </button>
                )}

                {quickCheckResult && (
                  <div
                    className={`alert mt-3 ${
                      quickCheckResult.is_correct
                        ? "alert-success"
                        : "alert-warning"
                    }`}
                    role="status"
                  >
                    <strong>
                      {quickCheckResult.is_correct
                        ? "Correct! Well done."
                        : `Not quite. The correct answer is ${quickCheckResult.correct_answer}.`}
                    </strong>

                    <p className="mb-0 mt-2">
                      {quickCheckResult.explanation}
                    </p>
                  </div>
                )}
              </>
            )}

            {!quickCheck && !quickCheckError && (
              <p className="small text-muted mb-0">
                Generate a question based on your uploaded study material
                to check your understanding.
              </p>
            )}
          </section>

          <div className="tutor-input-area">
            <textarea
              className="form-control"
              placeholder="Explain your thinking or ask a follow-up..."
              rows={2}
              value={answer}
              disabled={loadingHistory || sending || ending}
              onChange={(event) => setAnswer(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendAnswer();
                }
              }}
            />

            <div className="d-flex justify-content-between align-items-center mt-2">
              <small className="text-muted">
                Enter to send · Shift + Enter for a new line
              </small>

              <button
                type="button"
                className="btn btn-primary"
                onClick={sendAnswer}
                disabled={
                  !answer.trim() ||
                  sending ||
                  loadingHistory ||
                  ending
                }
              >
                {sending ? "Sending..." : "Send"}
                <Send size={15} className="ms-2" />
              </button>
            </div>
          </div>
        </main>

        <aside className="tutor-progress-panel">
          <h6>Session Progress</h6>

          <div className="tutor-progress-number">{progress}%</div>

          <div className="progress mb-4">
            <div
              className="progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="tutor-stat">
            <span>Messages</span>
            <strong>{userMessageCount}</strong>
          </div>

          <div className="tutor-stat">
            <span>Hints used</span>
            <strong>{hintShown ? 1 : 0}</strong>
          </div>

          <div className="tutor-stat">
            <span>Checks submitted</span>
            <strong>{submitted ? 1 : 0}</strong>
          </div>

          <p className="small text-muted mt-3 mb-0">
            Quick-check answers are evaluated by the backend.
            Progress shown here is for the current UI session.
          </p>
        </aside>
      </div>
    </div>
  );
};

export default TutorSession;
