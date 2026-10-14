import React from "react";
import { CheckCircle, CircleHelp } from "lucide-react";

const TutorQuestion = ({
  question,
  selectedAnswer,
  onSelect,
  submitted,
}) => {
  return (
    <div className="tutor-interactive-question">
      <div className="d-flex align-items-center gap-2 mb-3">
        <CircleHelp size={19} />
        <strong>Check your understanding</strong>
      </div>

      <p>{question.question}</p>

      <div className="tutor-answer-options">
        {question.options.map((option) => {
          const selected = selectedAnswer === option.id;

          return (
            <button
              type="button"
              key={option.id}
              disabled={submitted}
              className={`tutor-answer-option ${
                selected ? "selected" : ""
              }`}
              onClick={() => onSelect(option.id)}
            >
              <span className="tutor-answer-letter">
                {option.id}
              </span>
              <span>{option.text}</span>
            </button>
          );
        })}
      </div>

      {submitted && (
        <div className="tutor-question-feedback">
          <CheckCircle size={17} />
          Answer submitted. Your tutor will review it.
        </div>
      )}
    </div>
  );
};

export default TutorQuestion;