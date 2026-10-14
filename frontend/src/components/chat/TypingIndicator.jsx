import React from 'react';
import { Sparkles } from 'lucide-react';

const TypingIndicator = () => {
  return (
    <div className="chat-message-row assistant">
      <div className="chat-avatar assistant">
        <Sparkles size={16} />
      </div>
      <div className="chat-bubble assistant py-2 px-3">
        <div className="typing-dots">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
