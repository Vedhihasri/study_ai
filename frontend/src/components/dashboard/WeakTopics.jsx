import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronRight, ClipboardCheck } from 'lucide-react';

const WeakTopics = ({ topics = [] }) => {
  const navigate = useNavigate();

  if (!topics || topics.length === 0) {
    return (
      <div className="card-sa h-100">
        <div className="card-sa-header">
          <div className="d-flex align-items-center gap-2">
            <AlertCircle size={18} className="text-secondary" />
            <h3 className="fs-6 fw-semibold mb-0">Weak Topics</h3>
          </div>
        </div>
        <div className="card-sa-body d-flex flex-column align-items-center justify-content-center text-center p-4">
          <div className="p-3 rounded-circle bg-light text-secondary mb-3">
            <ClipboardCheck size={24} />
          </div>
          <h4 className="fs-6 fw-semibold text-dark mb-1">No weak topics recorded</h4>
          <p className="text-secondary fs-7 mb-3" style={{ maxWidth: '280px' }}>
            Your weak topics will appear here after you complete quizzes.
          </p>
          <button
            className="btn-secondary-sa"
            onClick={() => navigate('/quiz')}
          >
            <span>Take a quiz</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-sa h-100">
      <div className="card-sa-header">
        <div className="d-flex align-items-center gap-2">
          <AlertCircle size={18} className="text-warning" />
          <h3 className="fs-6 fw-semibold mb-0">Weak Topics</h3>
        </div>
        <button
          className="btn text-secondary p-0 fs-7 text-decoration-none"
          onClick={() => navigate('/analytics')}
        >
          View all
        </button>
      </div>
      <div className="card-sa-body p-0">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className="d-flex align-items-center justify-content-between p-3 border-bottom text-decoration-none text-dark"
            style={{ cursor: 'pointer', transition: 'background-color 0.15s' }}
            onClick={() => navigate('/quiz')}
          >
            <div>
              <div className="fw-semibold fs-7 mb-1">{topic.name}</div>
              <div className="text-muted fs-7">{topic.subject} • {topic.accuracy}% mastery</div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge-sa badge-sa-failed">Needs Review</span>
              <ChevronRight size={16} className="text-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeakTopics;
