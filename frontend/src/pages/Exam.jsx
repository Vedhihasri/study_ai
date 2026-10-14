import React, { useEffect, useState } from "react";
import { Card, Button, Form, Row, Col, Spinner, Alert, Modal } from "react-bootstrap";
import { FileText, Clock3, Brain, History, RotateCcw, ChevronRight } from "lucide-react";
import { getDocuments } from "../services/documentService";
import { generateExam, submitExam, getExams, getExam, getExamAttempts } from "../services/examService";

const Exam = () => {
  const [documents, setDocuments] = useState([]);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(10);
  const [duration, setDuration] = useState(30);
  const [documentId, setDocumentId] = useState("");
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [attempts, setAttempts] = useState({});
  const [loadingAttempts, setLoadingAttempts] = useState({});
  const [selectedExamForAttempts, setSelectedExamForAttempts] = useState(null);

  const [exam, setExam] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [totalTime, setTotalTime] = useState(0);

  const loadDocuments = async () => {
    try {
      setLoadingDocuments(true);
      setDocuments(await getDocuments());
    } catch (err) {
      console.error(err);
      setError("Failed to load documents.");
    } finally {
      setLoadingDocuments(false);
    }
  };

  const loadAttempts = async (examId) => {
    try {
      setLoadingAttempts((p) => ({ ...p, [examId]: true }));
      const data = await getExamAttempts(examId);
      setAttempts((p) => ({ ...p, [examId]: data }));
    } catch (err) {
      console.error(`Failed to load attempts for exam ${examId}:`, err);
      setAttempts((p) => ({ ...p, [examId]: [] }));
    } finally {
      setLoadingAttempts((p) => ({ ...p, [examId]: false }));
    }
  };

  const loadExams = async () => {
    try {
      setLoadingExams(true);
      const data = await getExams();
      setExams(data);
      await Promise.all(data.map((item) => loadAttempts(item.id)));
    } catch (err) {
      console.error("Failed to load exams:", err);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleOpenExam = async (examId) => {
    try {
      setError("");
      const fullExam = await getExam(examId);
      setExam(fullExam);
      setCurrentQuestion(0);
      setAnswers({});
      setResult(null);
      const seconds = fullExam.duration_minutes * 60;
      setTimeLeft(seconds);
      setTotalTime(seconds);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to open exam.");
    }
  };

  useEffect(() => {
    loadDocuments();
    loadExams();
  }, []);

  useEffect(() => {
    if (!exam || result || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [exam, result]);

  useEffect(() => {
    if (exam && !result && timeLeft === 0 && totalTime > 0 && !submitting) {
      handleSubmit();
    }
  }, [exam, result, timeLeft, totalTime, submitting]);

  const formatTime = (seconds) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const formatAttemptTime = (seconds) => {
    if (seconds === null || seconds === undefined) return null;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  const scoreClass = (score) =>
    score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-danger";

  const handleAnswer = (questionId, answer) =>
    setAnswers((p) => ({ ...p, [questionId]: answer }));

  const goToNextQuestion = () => {
    if (exam && currentQuestion < exam.questions.length - 1) {
      setCurrentQuestion((p) => p + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) setCurrentQuestion((p) => p - 1);
  };

  const handleSubmit = async () => {
    if (!exam || submitting) return;
    try {
      setSubmitting(true);
      setError("");
      const submissionResult = await submitExam(
        exam.id,
        answers,
        Math.max(0, totalTime - timeLeft)
      );
      setResult(submissionResult);
      await loadExams();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to submit exam.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    if (!topic.trim()) {
      setError("Please enter an exam topic.");
      return;
    }
    try {
      setGenerating(true);
      const generatedExam = await generateExam({
        topic: topic.trim(),
        difficulty,
        question_count: Number(questionCount),
        duration_minutes: Number(duration),
        document_id: documentId ? Number(documentId) : null,
      });
      setExam(generatedExam);
      setCurrentQuestion(0);
      setAnswers({});
      const seconds = generatedExam.duration_minutes * 60;
      setTimeLeft(seconds);
      setTotalTime(seconds);
      setResult(null);
      await loadExams();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to generate exam.");
    } finally {
      setGenerating(false);
    }
  };

  // ========================= RESULT =========================
  if (result) {
    return (
      <div className="container-fluid py-4">
        <div className="mb-4">
          <h2 className="fw-bold">Exam Result</h2>
          <p className="text-muted">{exam.title}</p>
        </div>
        {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
        <Row className="g-4">
          {[['Score', result.score, 'text-primary'], ['Correct', result.correct_answers, 'text-success'], ['Wrong', result.wrong_answers, 'text-danger'], ['Skipped', result.skipped_questions, 'text-secondary']].map(([label, value, cls]) => (
            <Col md={3} key={label}>
              <Card className="border-0 shadow-sm h-100"><Card.Body className="text-center"><h6 className="text-muted">{label}</h6><h1 className={`fw-bold ${cls}`}>{value}{label === 'Score' ? '%' : ''}</h1></Card.Body></Card>
            </Col>
          ))}
        </Row>
        <Card className="border-0 shadow-sm mt-4"><Card.Body><div className="d-flex justify-content-between"><span className="text-muted">Time Taken</span><strong>{formatAttemptTime(result.time_taken_seconds)}</strong></div></Card.Body></Card>
        <Card className="border-0 shadow-sm mt-4"><Card.Body>
          <h5 className="fw-bold mb-4">Question Review</h5>
          {result.results.map((item, index) => (
            <div key={item.question_id} className="border rounded-3 p-3 mb-3">
              <div className="d-flex justify-content-between"><strong>Question {index + 1}</strong>{item.is_correct ? <span className="text-success fw-semibold">Correct</span> : item.is_skipped ? <span className="text-secondary fw-semibold">Skipped</span> : <span className="text-danger fw-semibold">Wrong</span>}</div>
              <p className="mt-3 mb-2">{item.question}</p>
              <div className="small"><div>Your answer: <strong>{item.selected_answer || "Not answered"}</strong></div><div>Correct answer: <strong>{item.correct_answer}</strong></div></div>
              {item.explanation && <div className="mt-3 p-3 bg-light rounded"><strong>Explanation:</strong> {item.explanation}</div>}
            </div>
          ))}
        </Card.Body></Card>
        <Button variant="primary" className="mt-4" onClick={() => { setExam(null); setResult(null); setAnswers({}); setCurrentQuestion(0); setTimeLeft(0); setTotalTime(0); setError(""); }}>Create New Exam</Button>
      </div>
    );
  }

  // ========================= EXAM INTERFACE =========================
  if (exam) {
    const question = exam.questions[currentQuestion];
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4"><div><h3 className="fw-bold mb-1">{exam.title}</h3><span className="text-muted">{exam.question_count} Questions</span></div><div className={`px-4 py-2 rounded-3 fw-bold ${timeLeft <= 60 ? "bg-danger text-white" : "bg-primary bg-opacity-10 text-primary"}`}><Clock3 size={18} className="me-2" />{formatTime(timeLeft)}</div></div>
        {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
        <Row>
          <Col lg={9}><Card className="border-0 shadow-sm"><Card.Body className="p-4"><div className="d-flex justify-content-between mb-4"><span className="fw-semibold">Question {currentQuestion + 1} of {exam.questions.length}</span><span className="text-muted">{answers[question.id] ? "Answered" : "Not answered"}</span></div><h5 className="fw-semibold mb-4">{question.question}</h5><div className="d-grid gap-3">{["A", "B", "C", "D"].map((option) => { const optionText = question[`option_${option.toLowerCase()}`]; const selected = answers[question.id] === option; return <Button key={option} variant={selected ? "primary" : "light"} className="text-start p-3 border" onClick={() => handleAnswer(question.id, option)}><strong className="me-3">{option}.</strong>{optionText}</Button>; })}</div><div className="d-flex justify-content-between mt-5"><Button variant="outline-secondary" disabled={currentQuestion === 0} onClick={goToPreviousQuestion}>Previous</Button>{currentQuestion < exam.questions.length - 1 ? <Button variant="primary" onClick={goToNextQuestion}>Next</Button> : <Button variant="success" disabled={submitting} onClick={handleSubmit}>{submitting ? <><Spinner animation="border" size="sm" className="me-2" />Submitting...</> : "Submit Exam"}</Button>}</div></Card.Body></Card></Col>
          <Col lg={3} className="mt-4 mt-lg-0"><Card className="border-0 shadow-sm"><Card.Body><h6 className="fw-bold mb-3">Questions</h6><div className="d-flex flex-wrap gap-2">{exam.questions.map((questionItem, index) => { const answered = answers[questionItem.id]; return <Button key={questionItem.id} size="sm" variant={index === currentQuestion ? "primary" : answered ? "success" : "outline-secondary"} onClick={() => setCurrentQuestion(index)} style={{ width: "42px", height: "42px" }}>{index + 1}</Button>; })}</div><hr /><div className="small text-muted"><div className="mb-2"><span className="badge bg-success me-2">✓</span>Answered</div><div><span className="badge bg-secondary me-2">-</span>Not answered</div></div></Card.Body></Card></Col>
        </Row>
      </div>
    );
  }

  // ========================= SETUP + HISTORY =========================
  return (
    <div className="container-fluid py-4">
      <div className="mb-4"><h2 className="fw-bold mb-1">Exam Mode</h2><p className="text-muted mb-0">Test your understanding with a timed exam based on your study material.</p></div>

      <Row ><Col xs={12}><Card className="border-0 shadow-sm"><Card.Body className="p-4 p-lg-5">
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 p-3 mb-3">
            <Brain size={30} className="text-primary" />
          </div>
          <h4 className="fw-bold">Create Your Exam</h4><p className="text-muted">Choose your study material and exam settings.
          </p>
        </div>
        {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
        <Form onSubmit={handleGenerate}> 
          <Form.Group className="mb-4"><Form.Label className="fw-semibold">
            <FileText size={17} className="me-2" />Study Material</Form.Label>{loadingDocuments ? <div className="text-muted">
              <Spinner animation="border" size="sm" className="me-2" />Loading documents...</div> 
                :
               <Form.Select value={documentId} onChange={(e) => setDocumentId(e.target.value)}>
                <option value="">All Documents</option>{documents.map((document) => <option key={document.id} value={document.id}>{document.filename}</option>)}</Form.Select>}<Form.Text className="text-muted">Select a document or use all available study material.
            </Form.Text></Form.Group>
          <Form.Group className="mb-4"><Form.Label className="fw-semibold">Topic</Form.Label><Form.Control type="text" placeholder="e.g. Reflection of Light" value={topic} onChange={(e) => setTopic(e.target.value)} /></Form.Group>
          <Row><Col md={4}><Form.Group className="mb-4"><Form.Label className="fw-semibold">Difficulty</Form.Label><Form.Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></Form.Select></Form.Group></Col><Col md={4}><Form.Group className="mb-4"><Form.Label className="fw-semibold">Questions</Form.Label><Form.Select value={questionCount} onChange={(e) => setQuestionCount(e.target.value)}><option value="5">5 Questions</option><option value="10">10 Questions</option><option value="15">15 Questions</option><option value="20">20 Questions</option></Form.Select></Form.Group></Col><Col md={4}><Form.Group className="mb-4"><Form.Label className="fw-semibold"><Clock3 size={16} className="me-1" />Duration</Form.Label><Form.Select value={duration} onChange={(e) => setDuration(e.target.value)}><option value="10">10 Minutes</option><option value="20">20 Minutes</option><option value="30">30 Minutes</option><option value="45">45 Minutes</option><option value="60">60 Minutes</option></Form.Select></Form.Group></Col></Row>
          <div className="d-grid mt-3"><Button type="submit" variant="primary" size="lg" disabled={generating}>{generating ? <><Spinner animation="border" size="sm" className="me-2" />Generating Exam...</> : <><Brain size={18} className="me-2" />Generate Exam</>}</Button></div>
        </Form>
      </Card.Body></Card></Col></Row>

      {/* FULL-WIDTH EXAM HISTORY */}
      <div className="mt-5">
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-4 p-lg-5">
            <div className="d-flex justify-content-between align-items-center mb-4"><div className="d-flex align-items-center"><div className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 p-2 me-3"><History size={22} className="text-primary" /></div><div><h4 className="fw-bold mb-1">Exam History</h4><p className="text-muted mb-0 small">Your generated exams and latest performance</p></div></div><span className="badge bg-light text-dark border px-3 py-2">{exams.length} {exams.length === 1 ? "Exam" : "Exams"}</span></div>

            {loadingExams ? <div className="text-center py-5"><Spinner animation="border" size="sm" /><p className="text-muted mt-2 mb-0">Loading exam history...</p></div> : exams.length === 0 ? <div className="text-center py-5"><History size={40} className="text-muted mb-3" /><h6 className="fw-semibold">No exams yet</h6><p className="text-muted mb-0">Generate your first exam and it will appear here.</p></div> : <Row className="g-4">{exams.map((item) => {
              const examAttempts = attempts[item.id] || [];
              const latestAttempt = examAttempts[0];
              return <Col key={item.id} xl={4} lg={6}>
                <Card className="h-100 border shadow-sm"><Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start gap-3"><div><h5 className="fw-bold mb-1">{item.title}</h5><div className="text-muted small">{item.topic || "General Topic"}</div></div><span className={`badge ${item.difficulty === "easy" ? "bg-success" : item.difficulty === "hard" ? "bg-danger" : "bg-warning text-dark"}`}>{item.difficulty}</span></div>
                  <hr />
                  <Row className="small mb-3"><Col xs={4}><div className="fw-bold">{item.question_count}</div><div className="text-muted">Questions</div></Col><Col xs={4}><div className="fw-bold">{item.duration_minutes}m</div><div className="text-muted">Duration</div></Col><Col xs={4}><div className="fw-bold">{item.document_id ? "Document" : "All"}</div><div className="text-muted">Source</div></Col></Row>
                  <div className="small text-muted pb-3 border-bottom">Created {new Date(item.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</div>

                  <div className="pt-3"><div className="d-flex justify-content-between align-items-center mb-2"><div className="fw-semibold">Previous Attempts</div><span className="badge bg-light text-dark border">{examAttempts.length}</span></div>
                    {loadingAttempts[item.id] ? <div className="text-center py-4"><Spinner animation="border" size="sm" /><div className="small text-muted mt-2">Loading attempts...</div></div> : latestAttempt ? <>
                      <div className="rounded-3 bg-light p-3 mb-3"><div className="d-flex justify-content-between align-items-start"><div><div className="small text-muted">Latest Attempt</div><div className="fw-bold">Attempt {examAttempts.length}</div></div><div className={`fs-4 fw-bold ${scoreClass(latestAttempt.score)}`}>{latestAttempt.score}%</div></div><div className="d-flex gap-3 flex-wrap small mt-3"><span><strong className="text-success">{latestAttempt.correct_answers}</strong> Correct</span><span><strong className="text-danger">{latestAttempt.wrong_answers}</strong> Wrong</span><span><strong className="text-secondary">{latestAttempt.skipped_questions}</strong> Skipped</span></div><div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top small text-muted"><span>{latestAttempt.created_at ? new Date(latestAttempt.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : ""}</span>{latestAttempt.time_taken_seconds != null && <span><Clock3 size={13} className="me-1" />{formatAttemptTime(latestAttempt.time_taken_seconds)}</span>}</div></div>
                      {examAttempts.length > 1 && <Button variant="outline-secondary" size="sm" className="w-100 mb-2" onClick={() => setSelectedExamForAttempts(item)}><History size={15} className="me-2" />View All Attempts</Button>}
                    </> : <div className="text-center rounded-3 bg-light py-4 mb-3"><div className="small text-muted">No attempts yet</div></div>}
                    <Button variant="outline-primary" className="w-100" onClick={() => handleOpenExam(item.id)}><RotateCcw size={15} className="me-2" />Take This Exam Again<ChevronRight size={15} className="ms-2" /></Button>
                  </div>
                </Card.Body></Card>
              </Col>;
            })}</Row>}
          </Card.Body>
        </Card>
      </div>

      {/* ALL ATTEMPTS MODAL */}
      <Modal show={!!selectedExamForAttempts} onHide={() => setSelectedExamForAttempts(null)} centered size="lg">
        <Modal.Header closeButton><div><Modal.Title className="fw-bold">Attempt History</Modal.Title>{selectedExamForAttempts && <div className="text-muted small mt-1">{selectedExamForAttempts.title}</div>}</div></Modal.Header>
        <Modal.Body>{selectedExamForAttempts && (attempts[selectedExamForAttempts.id] || []).length > 0 ? <div className="d-grid gap-3">{(attempts[selectedExamForAttempts.id] || []).map((attempt, index) => { const list = attempts[selectedExamForAttempts.id] || []; return <div key={attempt.id} className="border rounded-3 p-3"><div className="d-flex justify-content-between align-items-start"><div><div className="small text-muted">{index === 0 ? "Latest Attempt" : "Previous Attempt"}</div><div className="fw-bold">Attempt {list.length - index}</div></div><div className={`fs-4 fw-bold ${scoreClass(attempt.score)}`}>{attempt.score}%</div></div><Row className="small mt-3"><Col xs={4}><div className="text-muted">Correct</div><strong className="text-success">{attempt.correct_answers}</strong></Col><Col xs={4}><div className="text-muted">Wrong</div><strong className="text-danger">{attempt.wrong_answers}</strong></Col><Col xs={4}><div className="text-muted">Skipped</div><strong className="text-secondary">{attempt.skipped_questions}</strong></Col></Row><div className="d-flex justify-content-between align-items-center border-top mt-3 pt-2 small text-muted"><span>{attempt.created_at ? new Date(attempt.created_at).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : ""}</span>{attempt.time_taken_seconds != null && <span><Clock3 size={13} className="me-1" />{formatAttemptTime(attempt.time_taken_seconds)}</span>}</div></div>; })}</div> : <div className="text-center py-5 text-muted"><History size={36} className="mb-2" /><div>No attempts found.</div></div>}</Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setSelectedExamForAttempts(null)}>Close</Button>{selectedExamForAttempts && <Button variant="primary" onClick={() => { const id = selectedExamForAttempts.id; setSelectedExamForAttempts(null); handleOpenExam(id); }}><RotateCcw size={15} className="me-2" />Take Exam Again</Button>}</Modal.Footer>
      </Modal>
    </div>
  );
};

export default Exam;
