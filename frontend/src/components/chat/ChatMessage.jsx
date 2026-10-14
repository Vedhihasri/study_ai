import React, { useState } from 'react';
import SourceList from './SourceList';
import useAuth from '../../hooks/useAuth';
import { Sparkles, User, Copy, Check, RotateCw, ThumbsUp, ThumbsDown } from 'lucide-react';

const ChatMessage = ({ message, onRegenerate }) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const isUser = message.role === 'user';

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLike = () => {
    setLiked((prev) => !prev);
    if (disliked) setDisliked(false);
  };

  const handleDislike = () => {
    setDisliked((prev) => !prev);
    if (liked) setLiked(false);
  };

  return (
    <div className={`chat-message-row ${isUser ? 'user' : 'assistant'}`}>
      {/* Avatar */}
      <div className={`chat-avatar ${isUser ? 'user' : 'assistant'}`}>
        {isUser ? userInitials : <Sparkles size={16} />}
      </div>

      {/* Bubble + Actions */}
      <div className="d-flex flex-column" style={{ maxWidth: '100%' }}>
        <div className={`chat-bubble ${isUser ? 'user' : 'assistant'}`}>
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {message.content}
          </div>

          {/* Source Citations */}
          {!isUser && message.sources && (
            <SourceList sources={message.sources} />
          )}
        </div>

        {/* AI Action Toolbar */}
        {!isUser && (
          <div className="chat-action-toolbar">
            <button
              className="chat-action-btn"
              onClick={handleCopy}
              title="Copy message to clipboard"
            >
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              className="chat-action-btn"
              onClick={onRegenerate}
              title="Regenerate AI response"
            >
              <RotateCw size={14} />
              <span>Regenerate</span>
            </button>

            <button
              className={`chat-action-btn ${liked ? 'text-primary fw-bold' : ''}`}
              onClick={handleLike}
              title="Good response"
            >
              <ThumbsUp size={14} />
            </button>

            <button
              className={`chat-action-btn ${disliked ? 'text-danger fw-bold' : ''}`}
              onClick={handleDislike}
              title="Poor response"
            >
              <ThumbsDown size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
