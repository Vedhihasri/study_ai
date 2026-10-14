import React, { useEffect, useState } from "react";
import {
  Brain,
  BookOpen,
  GraduationCap,
  Sparkles,
  Lightbulb,
  Compass,
  CheckCircle2,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";
import { createTutorSession,getDocuments, } from "../../services/api";

const levels = [
  {
    value: "beginner",
    label: "Beginner",
    description: "Start with the fundamentals",
    icon: Lightbulb,
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Build on what you know",
    icon: BookOpen,
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "Explore deeper concepts",
    icon: GraduationCap,
  },
];

const styles = [
  {
    value: "guided",
    label: "Guided",
    description: "Learn step by step",
    icon: Compass,
  },
  {
    value: "socratic",
    label: "Socratic",
    description: "Learn through questions",
    icon: Brain,
  },
  {
    value: "explanation-first",
    label: "Explanation first",
    description: "Understand, then practise",
    icon: Sparkles,
  },
];

const TutorSetup = ({ onStart }) => {
  const [topic, setTopic] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [level, setLevel] = useState("beginner");
  const [style, setStyle] = useState("guided");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

const [documents, setDocuments] = useState([]);
const [documentsLoading, setDocumentsLoading] = useState(true);
const [documentsError, setDocumentsError] = useState("");


useEffect(() => {
  let active = true;

  const loadDocuments = async () => {
    try {
      setDocumentsLoading(true);
      setDocumentsError("");

      const data = await getDocuments();

      if (active) {
        setDocuments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (active) {
        setDocumentsError(
          err.response?.data?.detail ||
            "Unable to load your study materials."
        );
      }
    } finally {
      if (active) {
        setDocumentsLoading(false);
      }
    }
  };

  loadDocuments();

  return () => {
    active = false;
  };
}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!topic.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const sessionData = {
        topic: topic.trim(),
        level,
        style,
        document_id: documentId ? Number(documentId) : null,
      };

      const session = await createTutorSession(sessionData);

      onStart({
        ...session,
        sessionId: session.id,
        topic: session.topic,
        documentId: session.document_id ?? null,
        level: session.level,
        style: session.style,
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to start your tutoring session. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tutor-setup-wrapper">
      <div className="tutor-setup-card">
        <div className="tutor-setup-heading">
          <div className="tutor-setup-icon">
            <Brain size={25} />
          </div>

          <span className="tutor-setup-eyebrow">
            YOUR LEARNING JOURNEY
          </span>

          <h2>What shall we learn today?</h2>

          <p>
            Personalise your learning session. Your AI tutor will
            adapt its explanations and practice to your needs.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="tutor-setup-field">
            <label htmlFor="tutor-topic" className="form-label">
              <BookOpen size={16} />
              What do you want to learn?
            </label>

            <input
              id="tutor-topic"
              type="text"
              className="form-control tutor-topic-input"
              placeholder="e.g. Reflection of light, DBMS, Python..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              maxLength={200}
            />

            <small>Enter a subject, concept, or question.</small>
          </div>


<div className="tutor-setup-field">
  <label htmlFor="tutor-document" className="form-label">
    <BookOpen size={16} />
    Study material
  </label>

  <select
    id="tutor-document"
    className="form-select"
    value={documentId}
    onChange={(e) => setDocumentId(e.target.value)}
    disabled={documentsLoading}
  >
    <option value="">
      {documentsLoading
        ? "Loading study materials..."
        : "Use all available documents"}
    </option>

    {documents
      .filter((doc) => doc.status === "processed")
      .map((doc) => (
        <option key={doc.id} value={String(doc.id)}>
          {doc.filename}
        </option>
      ))}
  </select>

  {documentsError && (
    <small className="text-danger d-block mt-2">
      {documentsError}
    </small>
  )}

  {!documentsLoading &&
    !documentsError &&
    documents.filter((doc) => doc.status === "processed").length === 0 && (
      <small className="d-block mt-2">
        No processed study materials yet. Upload a PDF, DOCX, or TXT file first.
      </small>
    )}

  {!documentsLoading &&
    documents.some((doc) => doc.status === "processed") && (
      <small className="d-block mt-2">
        Choose a document to focus your tutoring session on that material.
      </small>
    )}
</div>


          <div className="tutor-setup-field">
            <label className="form-label">
              <GraduationCap size={16} />
              Choose your level
            </label>

            <div className="tutor-choice-grid">
              {levels.map(({ value, label, description, icon: Icon }) => (
                <button
                  type="button"
                  key={value}
                  className={`tutor-choice-card ${
                    level === value ? "active" : ""
                  }`}
                  aria-pressed={level === value}
                  onClick={() => setLevel(value)}
                >
                  <span className="tutor-choice-icon">
                    <Icon size={19} />
                  </span>

                  <span className="tutor-choice-copy">
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>

                  {level === value && (
                    <CheckCircle2
                      className="tutor-choice-check"
                      size={17}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="tutor-setup-field">
            <label className="form-label">
              <Sparkles size={16} />
              How would you like to learn?
            </label>

            <div className="tutor-choice-grid">
              {styles.map(({ value, label, description, icon: Icon }) => (
                <button
                  type="button"
                  key={value}
                  className={`tutor-choice-card ${
                    style === value ? "active" : ""
                  }`}
                  aria-pressed={style === value}
                  onClick={() => setStyle(value)}
                >
                  <span className="tutor-choice-icon">
                    <Icon size={19} />
                  </span>

                  <span className="tutor-choice-copy">
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>

                  {style === value && (
                    <CheckCircle2
                      className="tutor-choice-check"
                      size={17}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn tutor-start-btn w-100"
            disabled={!topic.trim() || loading}
          >
            {loading ? (
              <>
                <LoaderCircle size={18} className="tutor-loading-icon" />
                Starting your session...
              </>
            ) : (
              <>
                Start learning
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <p className="tutor-setup-footer">
            <Sparkles size={13} />
            A learning experience tailored to you
          </p>
        </form>
      </div>
    </div>
  );
};

export default TutorSetup;
