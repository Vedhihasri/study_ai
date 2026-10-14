import { useEffect, useState } from "react";
import {BookOpen,Sparkles,FileText,Brain,Loader2,ArrowLeft,ArrowRight,CheckCircle2,} from "lucide-react";
import { getDocuments } from "../services/documentService";
import { generateQuiz, submitQuiz,getQuizAttempts,getQuizzes,} from "../services/quizService";

const Quiz = () => {
  // -----------------------------
  // Setup state
  // -----------------------------
  const [topic, setTopic] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(5);

  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);

  // -----------------------------
  // Quiz state
  // -----------------------------
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loadingQuizHistory, setLoadingQuizHistory] = useState(false);
  // -----------------------------
  // UI state
  // -----------------------------
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDocuments();
    loadQuizzes();
  }, []);

  // -----------------------------
  // Load documents
  // -----------------------------
  const loadDocuments = async () => {
    try {
      setLoadingDocuments(true);

      const data = await getDocuments();

      setDocuments(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load your documents.");
    } finally {
      setLoadingDocuments(false);
    }
  };

  // -----------------------------
  // Generate quiz
  // -----------------------------
  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }

    try {
      setError("");
      setGenerating(true);

      const generatedQuiz = await generateQuiz({
        topic: topic.trim(),
        difficulty,
        question_count: Number(questionCount),
        document_id: documentId
          ? Number(documentId)
          : null,
      });

      setQuiz(generatedQuiz);
      loadQuizzes();
      setCurrentQuestion(0);
      setAnswers({});
    } catch (err) {
      console.error(err);

      const message =
        err?.response?.data?.detail ||
        "Unable to generate quiz. Please try again.";

      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  // -----------------------------
  // Select answer
  // -----------------------------
  const handleAnswer = (answer) => {
    const question = quiz.questions[currentQuestion];

    setAnswers((previous) => ({
      ...previous,
      [question.id]: answer,
    }));
  };

  // -----------------------------
  // Next question
  // -----------------------------
  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((previous) => previous + 1);
    }
  };

  // -----------------------------
  // Previous question
  // -----------------------------
  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((previous) => previous - 1);
    }
  };

  // -----------------------------
  // Submit quiz
  // -----------------------------
const handleSubmit = async () => {
  try {
    setSubmitting(true);
    setError("");

    const quizResult = await submitQuiz(
      quiz.id,
      answers
    );

    setResult(quizResult);

    // Load previous attempts
    try {
      setLoadingAttempts(true);

      const attemptHistory =
        await getQuizAttempts(quiz.id);

      setAttempts(attemptHistory);
    } catch (attemptError) {
      console.error(
        "Unable to load attempt history:",
        attemptError
      );
    } finally {
      setLoadingAttempts(false);
    }

  } catch (err) {
    console.error(err);

    const message =
      err?.response?.data?.detail ||
      "Unable to submit quiz.";

    setError(message);
  } finally {
    setSubmitting(false);
  }
};

const loadQuizzes = async () => {
  try {
    setLoadingQuizzes(true);

    const data = await getQuizzes();

    setQuizzes(data);
  } catch (error) {
    console.error("Failed to load quizzes:", error);
  } finally {
    setLoadingQuizzes(false);
  }
};

  // Load attempt summaries for all quizzes
  const loadQuizHistory = async (quizList) => {
    try {
      setLoadingQuizHistory(true);

      const history = await Promise.all(
        quizList.map(async (quizItem) => {
          try {
            const attempts = await getQuizAttempts(quizItem.id);

            return {
              ...quizItem,
              attempts,
              attemptCount: attempts.length,
              latestAttempt: attempts.length > 0 ? attempts[0] : null,
            };
          } catch (error) {
            console.error(
              `Failed to load attempts for quiz ${quizItem.id}:`,
              error
            );

            return {
              ...quizItem,
              attempts: [],
              attemptCount: 0,
              latestAttempt: null,
            };
          }
        })
      );

      setQuizHistory(history);
    } finally {
      setLoadingQuizHistory(false);
    }
  };

  useEffect(() => {
    if (quizzes.length > 0) {
      loadQuizHistory(quizzes);
    } else {
      setQuizHistory([]);
    }
  }, [quizzes]);

  // -----------------------------
  // Option helper
  // -----------------------------
  const getOptions = (question) => [
    {
      key: "A",
      text: question.option_a,
    },
    {
      key: "B",
      text: question.option_b,
    },
    {
      key: "C",
      text: question.option_c,
    },
    {
      key: "D",
      text: question.option_d,
    },
  ].filter((option) => option.text);

  // =====================================================
  // QUIZ MODE
  // =====================================================

  // =====================================================
// RESULTS MODE
// =====================================================

if (result) {
  const score = result.score;

  return (
    <div className="container-fluid px-4 py-4">

      {/* Header */}
      <div className="text-center mb-4">
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
          style={{
            width: "70px",
            height: "70px",
            backgroundColor:
              "rgba(25, 135, 84, 0.12)",
          }}
        >
          <CheckCircle2
            size={36}
            color="#198754"
          />
        </div>

        <h2 className="fw-bold mb-2">
          Quiz Completed!
        </h2>

        <p className="text-muted mb-0">
          {result.title}
        </p>
      </div>

      {/* Score Card */}
      <div className="row justify-content-center mb-4">
        <div className="col-xl-8 col-lg-10">

          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4 p-md-5">

              <div className="row align-items-center">

                {/* Score */}
                <div className="col-md-5 text-center mb-4 mb-md-0">

                  <div
                    className="mx-auto d-flex align-items-center justify-content-center rounded-circle"
                    style={{
                      width: "150px",
                      height: "150px",
                      border: "10px solid rgba(99, 102, 241, 0.12)",
                    }}
                  >
                    <div>
                      <div
                        className="fw-bold"
                        style={{
                          fontSize: "38px",
                          color: "#6366f1",
                        }}
                      >
                        {score}%
                      </div>

                      <small className="text-muted">
                        Score
                      </small>
                    </div>
                  </div>

                </div>

                {/* Statistics */}
                <div className="col-md-7">

                  <div className="row g-3">

                    {/* Correct */}
                    <div className="col-6">
                      <div
                        className="rounded-4 p-3"
                        style={{
                          backgroundColor:
                            "rgba(25, 135, 84, 0.08)",
                        }}
                      >
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <CheckCircle2
                            size={20}
                            color="#198754"
                          />

                          <span className="text-muted">
                            Correct
                          </span>
                        </div>

                        <h4 className="fw-bold mb-0">
                          {result.correct_answers}
                        </h4>
                      </div>
                    </div>

                    {/* Wrong */}
                    <div className="col-6">
                      <div
                        className="rounded-4 p-3"
                        style={{
                          backgroundColor:
                            "rgba(220, 53, 69, 0.08)",
                        }}
                      >
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span
                            style={{
                              color: "#dc3545",
                              fontSize: "20px",
                              fontWeight: "bold",
                            }}
                          >
                            ✕
                          </span>

                          <span className="text-muted">
                            Wrong
                          </span>
                        </div>

                        <h4 className="fw-bold mb-0">
                          {result.wrong_answers}
                        </h4>
                      </div>
                    </div>

                    {/* Skipped */}
                    <div className="col-6">
                      <div
                        className="rounded-4 p-3"
                        style={{
                          backgroundColor:
                            "rgba(108, 117, 125, 0.08)",
                        }}
                      >
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span
                            style={{
                              color: "#6c757d",
                              fontSize: "20px",
                            }}
                          >
                            —
                          </span>

                          <span className="text-muted">
                            Skipped
                          </span>
                        </div>

                        <h4 className="fw-bold mb-0">
                          {result.skipped_questions}
                        </h4>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="col-6">
                      <div
                        className="rounded-4 p-3"
                        style={{
                          backgroundColor:
                            "rgba(99, 102, 241, 0.08)",
                        }}
                      >
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <Brain
                            size={20}
                            color="#6366f1"
                          />

                          <span className="text-muted">
                            Total
                          </span>
                        </div>

                        <h4 className="fw-bold mb-0">
                          {result.total_questions}
                        </h4>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Review heading */}
      <div className="row justify-content-center">
        <div className="col-xl-8 col-lg-10">

          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h4 className="fw-bold mb-1">
                Review Your Answers
              </h4>

              <p className="text-muted mb-0">
                See what you got right and learn from your mistakes.
              </p>
            </div>
          </div>

          {/* Question results */}
          <div className="d-flex flex-column gap-3">

            {result.results.map(
              (item, index) => {

                const isCorrect =
                  item.is_correct;

                const isSkipped =
                  item.is_skipped;

                return (
                  <div
                    key={item.question_id}
                    className="card border-0 shadow-sm rounded-4"
                  >
                    <div className="card-body p-4">

                      {/* Question header */}
                      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">

                        <div>
                          <span className="text-muted small">
                            Question {index + 1}
                          </span>

                          <h6
                            className="fw-bold mt-1 mb-0"
                            style={{
                              lineHeight: "1.5",
                            }}
                          >
                            {item.question}
                          </h6>
                        </div>

                        {/* Status */}
                        {isCorrect ? (
                          <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2">
                            Correct
                          </span>
                        ) : isSkipped ? (
                          <span className="badge bg-secondary-subtle text-secondary rounded-pill px-3 py-2">
                            Skipped
                          </span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-2">
                            Wrong
                          </span>
                        )}

                      </div>

                      {/* Answer information */}
                      <div className="row g-3">

                        <div className="col-md-6">
                          <div
                            className="rounded-3 p-3"
                            style={{
                              backgroundColor:
                                isCorrect
                                  ? "rgba(25, 135, 84, 0.08)"
                                  : "rgba(220, 53, 69, 0.08)",
                            }}
                          >
                            <small className="text-muted d-block mb-1">
                              Your answer
                            </small>

                            <span className="fw-semibold">
                              {item.selected_answer
                                ? item.selected_answer
                                : "Not answered"}
                            </span>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div
                            className="rounded-3 p-3"
                            style={{
                              backgroundColor:
                                "rgba(25, 135, 84, 0.08)",
                            }}
                          >
                            <small className="text-muted d-block mb-1">
                              Correct answer
                            </small>

                            <span className="fw-semibold text-success">
                              {item.correct_answer}
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Explanation */}
                      {item.explanation && (
                        <div className="mt-3">

                          <div
                            className="rounded-3 p-3"
                            style={{
                              backgroundColor:
                                "rgba(99, 102, 241, 0.06)",
                            }}
                          >
                            <div className="fw-semibold mb-1">
                              💡 Explanation
                            </div>

                            <div className="text-muted">
                              {item.explanation}
                            </div>
                          </div>

                        </div>
                      )}

                    </div>
                  </div>
                );
              }
            )}

          </div>
            {/* Attempt History */}
<div className="mt-5">

  <div className="d-flex align-items-center justify-content-between mb-3">
    <div>
      <h4 className="fw-bold mb-1">
        Previous Attempts
      </h4>

      <p className="text-muted mb-0">
        Track how your performance changes over time.
      </p>
    </div>

    {!loadingAttempts && attempts.length > 0 && (
      <span className="badge bg-light text-dark rounded-pill px-3 py-2">
        {attempts.length}{" "}
        {attempts.length === 1
          ? "attempt"
          : "attempts"}
      </span>
    )}
  </div>

  {loadingAttempts ? (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4 text-center">

        <Loader2
          size={24}
          className="spin mb-2"
          color="#6366f1"
        />

        <div className="text-muted">
          Loading attempt history...
        </div>

      </div>
    </div>
  ) : attempts.length === 0 ? (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4 text-center">

        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
          style={{
            width: "52px",
            height: "52px",
            backgroundColor:
              "rgba(99, 102, 241, 0.10)",
          }}
        >
          <Brain
            size={24}
            color="#6366f1"
          />
        </div>

        <h6 className="fw-semibold">
          No previous attempts
        </h6>

        <p className="text-muted mb-0">
          Your quiz attempts will appear here.
        </p>

      </div>
    </div>
  ) : (
    <div className="d-flex flex-column gap-3">

      {attempts.map((attempt, index) => {

        const score = Number(attempt.score);

        const scoreClass =
          score >= 80
            ? "success"
            : score >= 50
            ? "warning"
            : "danger";

        const attemptDate = new Date(
          attempt.created_at
        );

        return (
          <div
            key={attempt.id}
            className="card border-0 shadow-sm rounded-4"
          >
            <div className="card-body p-4">

              <div className="row align-items-center">

                {/* Attempt number */}
                <div className="col-md-1 mb-3 mb-md-0">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle fw-bold"
                    style={{
                      width: "44px",
                      height: "44px",
                      backgroundColor:
                        "rgba(99, 102, 241, 0.10)",
                      color: "#6366f1",
                    }}
                  >
                    {attempts.length - index}
                  </div>
                </div>

                {/* Score */}
                <div className="col-md-3 mb-3 mb-md-0">

                  <div className="d-flex align-items-center gap-3">

                    <div>
                      <div className="text-muted small mb-1">
                        Score
                      </div>

                      <div
                        className={`fw-bold text-${scoreClass}`}
                        style={{
                          fontSize: "28px",
                        }}
                      >
                        {score}%
                      </div>
                    </div>

                  </div>

                </div>

                {/* Statistics */}
                <div className="col-md-5 mb-3 mb-md-0">

                  <div className="d-flex flex-wrap gap-3">

                    <div>
                      <small className="text-muted d-block">
                        Correct
                      </small>

                      <span className="fw-semibold text-success">
                        {attempt.correct_answers}
                      </span>
                    </div>

                    <div>
                      <small className="text-muted d-block">
                        Wrong
                      </small>

                      <span className="fw-semibold text-danger">
                        {attempt.wrong_answers}
                      </span>
                    </div>

                    <div>
                      <small className="text-muted d-block">
                        Skipped
                      </small>

                      <span className="fw-semibold text-secondary">
                        {attempt.skipped_questions}
                      </span>
                    </div>

                    <div>
                      <small className="text-muted d-block">
                        Total
                      </small>

                      <span className="fw-semibold">
                        {attempt.total_questions}
                      </span>
                    </div>

                  </div>

                </div>

                {/* Date */}
                <div className="col-md-3 text-md-end">

                  <small className="text-muted d-block">
                    Attempted
                  </small>

                  <span className="fw-semibold">
                    {attemptDate.toLocaleDateString(
                      undefined,
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </span>

                  <small className="text-muted d-block mt-1">
                    {attemptDate.toLocaleTimeString(
                      undefined,
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </small>

                </div>

              </div>

            </div>
          </div>
        );
      })}

    </div>
  )}

</div>
          {/* Actions */}
          <div className="d-flex justify-content-center gap-3 mt-4 mb-5">

            <button
              type="button"
              className="btn btn-outline-secondary rounded-3 px-4"
              onClick={() => {
                setQuiz(null);
                setResult(null);
                setAnswers({});
                setCurrentQuestion(0);
              }}
            >
              Back to Quizzes
            </button>

            <button
              type="button"
              className="btn btn-primary rounded-3 px-4"
              onClick={() => {
                setResult(null);
                setAnswers({});
                setCurrentQuestion(0);
              }}
            >
              Try Again
            </button>

          </div>

        </div>
      </div>

    </div>
  );
}
  if (quiz) {
    const question = quiz.questions[currentQuestion];

    const selectedAnswer = answers[question.id];

    const isLastQuestion =
      currentQuestion === quiz.questions.length - 1;

    const answeredCount = Object.keys(answers).length;

    const progress =
      ((currentQuestion + 1) /
        quiz.questions.length) *
      100;

    return (
      <div className="container-fluid px-4 py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <Brain size={22} color="#6366f1" />

              <h3 className="fw-bold mb-0">
                {quiz.title}
              </h3>
            </div>

            <p className="text-muted mb-0">
              {quiz.difficulty.charAt(0).toUpperCase() +
                quiz.difficulty.slice(1)}{" "}
              • {quiz.question_count} questions
            </p>
          </div>

          <div className="text-end">
            <div className="fw-semibold">
              {currentQuestion + 1} /{" "}
              {quiz.questions.length}
            </div>

            <small className="text-muted">
              {answeredCount} answered
            </small>
          </div>
        </div>

        {/* Progress */}
        <div
          className="progress mb-4"
          style={{
            height: "8px",
            borderRadius: "10px",
          }}
        >
          <div
            className="progress-bar"
            role="progressbar"
            style={{
              width: `${progress}%`,
              backgroundColor: "#6366f1",
            }}
          />
        </div>

        {error && (
          <div className="alert alert-danger rounded-3">
            {error}
          </div>
        )}

        {/* Question Card */}
        <div className="row justify-content-center">
          <div className="col-xl-8 col-lg-10">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4 p-md-5">

                {/* Question number */}
                <div className="mb-4">
                  <span
                    className="badge rounded-pill px-3 py-2"
                    style={{
                      backgroundColor:
                        "rgba(99, 102, 241, 0.12)",
                      color: "#6366f1",
                    }}
                  >
                    Question {currentQuestion + 1}
                  </span>
                </div>

                {/* Question */}
                <h4
                  className="fw-bold mb-4"
                  style={{ lineHeight: "1.5" }}
                >
                  {question.question}
                </h4>

                {/* Options */}
                <div className="d-flex flex-column gap-3">
                  {getOptions(question).map(
                    (option) => {
                      const isSelected =
                        selectedAnswer === option.key;

                      return (
                        <button
                          type="button"
                          key={option.key}
                          onClick={() =>
                            handleAnswer(option.key)
                          }
                          className="text-start border rounded-4 p-3"
                          style={{
                            backgroundColor: isSelected
                              ? "rgba(99, 102, 241, 0.08)"
                              : "#fff",

                            borderColor: isSelected
                              ? "#6366f1"
                              : "#dee2e6",

                            borderWidth: isSelected
                              ? "2px"
                              : "1px",

                            transition:
                              "all 0.2s ease",
                          }}
                        >
                          <div className="d-flex align-items-start gap-3">
                            <div
                              className="d-flex align-items-center justify-content-center rounded-circle fw-semibold"
                              style={{
                                minWidth: "38px",
                                width: "38px",
                                height: "38px",
                                backgroundColor:
                                  isSelected
                                    ? "#6366f1"
                                    : "#f1f3f5",
                                color: isSelected
                                  ? "#fff"
                                  : "#495057",
                              }}
                            >
                              {option.key}
                            </div>

                            <div
                              className="pt-2"
                              style={{
                                color: "#212529",
                              }}
                            >
                              {option.text}
                            </div>

                            {isSelected && (
                              <CheckCircle2
                                size={20}
                                color="#6366f1"
                                className="ms-auto mt-2"
                              />
                            )}
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>

                {/* Navigation */}
                <div className="d-flex justify-content-between align-items-center mt-5">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-3 px-4"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                  >
                    <ArrowLeft
                      size={18}
                      className="me-2"
                    />
                    Previous
                  </button>

                  {!isLastQuestion ? (
                    <button
                      type="button"
                      className="btn btn-primary rounded-3 px-4"
                      onClick={handleNext}
                    >
                      Next
                      <ArrowRight
                        size={18}
                        className="ms-2"
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-success rounded-3 px-4"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2
                            size={18}
                            className="me-2 spin"
                          />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit Quiz
                          <CheckCircle2
                            size={18}
                            className="ms-2"
                          />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Question navigation */}
            <div className="card border-0 shadow-sm rounded-4 mt-4">
              <div className="card-body p-3">
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {quiz.questions.map(
                    (item, index) => {
                      const answered =
                        answers[item.id];

                      const active =
                        index === currentQuestion;

                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() =>
                            setCurrentQuestion(index)
                          }
                          className="rounded-circle border-0 fw-semibold"
                          style={{
                            width: "40px",
                            height: "40px",

                            backgroundColor: active
                              ? "#6366f1"
                              : answered
                              ? "rgba(25, 135, 84, 0.15)"
                              : "#f1f3f5",

                            color: active
                              ? "#fff"
                              : answered
                              ? "#198754"
                              : "#495057",
                          }}
                        >
                          {index + 1}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>
          {`
            .spin {
              animation: spin 1s linear infinite;
            }

            @keyframes spin {
              from {
                transform: rotate(0deg);
              }

              to {
                transform: rotate(360deg);
              }
            }
          `}
        </style>
      </div>
    );
  }

  // =====================================================
  // QUIZ SETUP MODE
  // =====================================================

  return (
    <div className="container-fluid px-4 py-4">
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-2">
          <div
            className="d-flex align-items-center justify-content-center rounded-3"
            style={{
              width: "42px",
              height: "42px",
              background:
                "rgba(99, 102, 241, 0.12)",
            }}
          >
            <Brain size={22} color="#6366f1" />
          </div>

          <h2 className="fw-bold mb-0">
            Quiz
          </h2>
        </div>

        <p className="text-muted mb-0">
          Test your understanding using your study
          materials.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger rounded-3 mb-4">
          {error}
        </div>
      )}

      <div className="row g-4">
        {/* Generator */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4 p-md-5">

              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Sparkles
                    size={20}
                    color="#6366f1"
                  />

                  <h4 className="fw-bold mb-0">
                    Create a Quiz
                  </h4>
                </div>

                <p className="text-muted mb-0">
                  Generate questions directly from
                  your uploaded study materials.
                </p>
              </div>

              <form onSubmit={handleGenerate}>
                {/* Topic */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Topic
                  </label>

                  <input
                    type="text"
                    className="form-control form-control-lg rounded-3"
                    placeholder="e.g. Reflection of Light"
                    value={topic}
                    onChange={(e) =>
                      setTopic(e.target.value)
                    }
                  />
                </div>

                {/* Document */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Study Material
                  </label>

                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <FileText size={18} />
                    </span>

                    <select
                      className="form-select form-select-lg rounded-end-3"
                      value={documentId}
                      onChange={(e) =>
                        setDocumentId(
                          e.target.value
                        )
                      }
                      disabled={loadingDocuments}
                    >
                      <option value="">
                        {loadingDocuments
                          ? "Loading documents..."
                          : "Use all my documents"}
                      </option>

                      {documents.map(
                        (document) => (
                          <option
                            key={document.id}
                            value={document.id}
                          >
                            {document.filename}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {/* Difficulty */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Difficulty
                  </label>

                  <div className="row g-2">
                    {[
                      "easy",
                      "medium",
                      "hard",
                    ].map((level) => (
                      <div
                        className="col-4"
                        key={level}
                      >
                        <button
                          type="button"
                          className={`btn w-100 py-2 rounded-3 ${
                            difficulty === level
                              ? "btn-primary"
                              : "btn-outline-secondary"
                          }`}
                          onClick={() =>
                            setDifficulty(level)
                          }
                        >
                          {level
                            .charAt(0)
                            .toUpperCase() +
                            level.slice(1)}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Question count */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Number of Questions
                  </label>

                  <select
                    className="form-select form-select-lg rounded-3"
                    value={questionCount}
                    onChange={(e) =>
                      setQuestionCount(
                        Number(e.target.value)
                      )
                    }
                  >
                    {[5, 10, 15, 20].map(
                      (count) => (
                        <option
                          key={count}
                          value={count}
                        >
                          {count} questions
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Generate */}
                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100 rounded-3"
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <Loader2
                        size={20}
                        className="me-2 spin"
                      />
                      Generating Quiz...
                    </>
                  ) : (
                    <>
                      <Sparkles
                        size={20}
                        className="me-2"
                      />
                      Generate Quiz
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">

              <div
                className="d-flex align-items-center justify-content-center rounded-4 mb-4"
                style={{
                  width: "58px",
                  height: "58px",
                  background:
                    "rgba(99, 102, 241, 0.12)",
                }}
              >
                <BookOpen
                  size={27}
                  color="#6366f1"
                />
              </div>

              <h5 className="fw-bold mb-3">
                Practice smarter
              </h5>

              <p className="text-muted">
                Generate AI-powered questions from
                your uploaded study materials.
              </p>

              <div className="mt-4">
                <div className="d-flex gap-3 mb-3">
                  <div className="text-primary fw-bold">
                    01
                  </div>

                  <div>
                    <div className="fw-semibold">
                      Choose your topic
                    </div>

                    <small className="text-muted">
                      Focus on the concept you want
                      to practice.
                    </small>
                  </div>
                </div>

                <div className="d-flex gap-3 mb-3">
                  <div className="text-primary fw-bold">
                    02
                  </div>

                  <div>
                    <div className="fw-semibold">
                      Select difficulty
                    </div>

                    <small className="text-muted">
                      Choose easy, medium or hard
                      questions.
                    </small>
                  </div>
                </div>

                <div className="d-flex gap-3">
                  <div className="text-primary fw-bold">
                    03
                  </div>

                  <div>
                    <div className="fw-semibold">
                      Test yourself
                    </div>

                    <small className="text-muted">
                      Submit your answers and review
                      your mistakes.
                    </small>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          ALL QUIZ HISTORY
          ===================================================== */}
      <div className="mt-4">
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-4 p-md-5">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <BookOpen size={20} color="#6366f1" />
                  <h4 className="fw-bold mb-0">Quiz History</h4>
                </div>
                <p className="text-muted mb-0">
                  View your quizzes and track your previous performance.
                </p>
              </div>

              {!loadingQuizzes && (
                <span className="badge bg-light text-dark border rounded-pill px-3 py-2">
                  {quizzes.length}{" "}
                  {quizzes.length === 1 ? "quiz" : "quizzes"}
                </span>
              )}
            </div>

            {loadingQuizzes || loadingQuizHistory ? (
              <div className="text-center py-5">
                <Loader2 size={26} color="#6366f1" className="spin mb-2" />
                <div className="text-muted">Loading quiz history...</div>
              </div>
            ) : quizHistory.length === 0 ? (
              <div className="text-center py-5">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                  style={{
                    width: "56px",
                    height: "56px",
                    backgroundColor: "rgba(99, 102, 241, 0.10)",
                  }}
                >
                  <Brain size={26} color="#6366f1" />
                </div>

                <h6 className="fw-semibold mb-2">No quizzes yet</h6>

                <p className="text-muted mb-0">
                  Generate your first quiz and it will appear here.
                </p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {quizHistory.map((item) => {
                  const latestScore = item.latestAttempt
                    ? Number(item.latestAttempt.score)
                    : null;

                  const scoreClass =
                    latestScore === null
                      ? "secondary"
                      : latestScore >= 80
                      ? "success"
                      : latestScore >= 50
                      ? "warning"
                      : "danger";

                  return (
                    <div key={item.id} className="border rounded-4 p-3 p-md-4">
                      <div className="row align-items-center g-3">
                        <div className="col-lg-5">
                          <div className="d-flex align-items-start gap-3">
                            <div
                              className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                              style={{
                                width: "46px",
                                height: "46px",
                                backgroundColor: "rgba(99, 102, 241, 0.10)",
                              }}
                            >
                              <Brain size={22} color="#6366f1" />
                            </div>

                            <div>
                              <h6 className="fw-bold mb-1">{item.title}</h6>

                              <div className="d-flex flex-wrap gap-2 align-items-center">
                                {item.topic && (
                                  <span className="text-muted small">
                                    {item.topic}
                                  </span>
                                )}

                                <span className="badge bg-light text-dark border text-capitalize">
                                  {item.difficulty}
                                </span>

                                <span className="text-muted small">
                                  {item.question_count} questions
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="col-6 col-lg-2">
                          <small className="text-muted d-block mb-1">Attempts</small>
                          <span className="fw-bold">{item.attemptCount}</span>
                        </div>

                        <div className="col-6 col-lg-2">
                          <small className="text-muted d-block mb-1">
                            Latest Score
                          </small>

                          {latestScore !== null ? (
                            <span
                              className={`fw-bold text-${scoreClass}`}
                              style={{ fontSize: "20px" }}
                            >
                              {latestScore}%
                            </span>
                          ) : (
                            <span className="text-muted">Not attempted</span>
                          )}
                        </div>

                        <div className="col-md-6 col-lg-2">
                          <small className="text-muted d-block mb-1">
                            Last Attempt
                          </small>

                          {item.latestAttempt ? (
                            <span className="small fw-semibold">
                              {new Date(
                                item.latestAttempt.created_at
                              ).toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </div>

                        <div className="col-md-6 col-lg-1 text-lg-end">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm rounded-3 w-100"
                            onClick={async () => {
                              setError("");
                              setLoadingAttempts(true);

                              try {
                                const attemptHistory = await getQuizAttempts(item.id);

                                setQuiz(item);
                                setAttempts(attemptHistory);
                                setCurrentQuestion(0);
                                setAnswers({});
                                setResult(null);
                              } catch (error) {
                                console.error(
                                  "Unable to load attempt history:",
                                  error
                                );
                                setError("Unable to open quiz history.");
                              } finally {
                                setLoadingAttempts(false);
                              }
                            }}
                          >
                            Open
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>
        {`
          .spin {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Quiz;