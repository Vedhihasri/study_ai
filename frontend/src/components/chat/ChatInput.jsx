import React, { useState, useRef } from 'react';
import { Paperclip, Send, Square, AlertCircle } from 'lucide-react';
import { Toast, ToastContainer } from 'react-bootstrap';

const ChatInput = ({ onSendMessage, isStreaming = false, onStop, disabled = false }) => {
  const [text, setText] = useState('');
  const [showAttachNotice, setShowAttachNotice] = useState(false);
  const textareaRef = useRef(null);

  const handleSend = () => {
    if (!text.trim() || disabled || isStreaming) return;
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) return;
      handleSend();
    }
  };

  const handleInput = (e) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="chat-input-area position-relative">
      {/* Document Attachment Notice Toast */}
      <ToastContainer position="top-center" className="p-3" style={{ zIndex: 1050 }}>
        <Toast
          show={showAttachNotice}
          onClose={() => setShowAttachNotice(false)}
          delay={3000}
          autohide
          className="bg-dark text-white border-0 shadow"
        >
          <Toast.Body className="d-flex align-items-center gap-2 fs-7 py-2">
            <AlertCircle size={16} className="text-warning flex-shrink-0" />
            <span>Document upload will be connected in Phase 8. Use /documents page for uploads!</span>
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <div className="chat-input-box">
        <textarea
          ref={textareaRef}
          rows={1}
          className="chat-textarea"
          placeholder={isStreaming ? "AI is generating an answer..." : "Ask anything about your study materials..."}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled || isStreaming}
        />

        <div className="d-flex align-items-center justify-content-between mt-2 pt-1 border-top border-light">
          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              className="btn-icon-sa"
              title="Attach document"
              onClick={() => setShowAttachNotice(true)}
              disabled={disabled || isStreaming}
            >
              <Paperclip size={18} />
            </button>
            <span className="text-muted fs-7 d-none d-sm-inline" style={{ fontSize: '0.75rem' }}>
              Enter to send · Shift + Enter for new line
            </span>
          </div>

          {isStreaming ? (
            <button
              type="button"
              className="btn-primary-sa bg-danger border-danger py-1.5 px-3 fs-7"
              onClick={onStop}
              title="Stop AI generation"
            >
              <span>Stop</span>
              <Square size={14} />
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary-sa py-1.5 px-3 fs-7"
              onClick={handleSend}
              disabled={!text.trim() || disabled}
            >
              <span>Send</span>
              <Send size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
