
import React from "react";
import { Brain, User, Lightbulb, CheckCircle } from "lucide-react";

const TutorMessage = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div
      className={`tutor-message ${
        isUser ? "tutor-message-user" : "tutor-message-ai"
      }`}
    >
      <div className={`tutor-message-avatar ${isUser ? "user" : "ai"}`}>
        {isUser ? <User size={18} /> : <Brain size={18} />}
      </div>

      <div className="tutor-message-content">
        <div className="tutor-message-meta">
          {isUser ? "You" : "AI Tutor"}
          {message.type === "hint" && (
            <span className="tutor-message-tag">
              <Lightbulb size={13} /> Hint
            </span>
          )}
          {message.type === "feedback" && (
            <span className="tutor-message-tag">
              <CheckCircle size={13} /> Feedback
            </span>
          )}
        </div>

        <div className="tutor-message-bubble">
          {message.content}
        </div>
      </div>
    </div>
  );
};

export default TutorMessage;