import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';
import { ProgressBar } from 'react-bootstrap';

const ContinueLearning = ({ session = null }) => {
  const navigate = useNavigate();

  if (!session) {
    return (
      <div className="card-sa h-100">
        <div className="card-sa-header">
          <div className="d-flex align-items-center gap-2">
            <BookOpen size={18} className="text-primary" />
            <h3 className="fs-6 fw-semibold mb-0">Continue Learning</h3>
          </div>
        </div>
        <div className="card-sa-body d-flex flex-column align-items-center justify-content-center text-center p-4">
          <div className="p-3 rounded-circle bg-light text-secondary mb-3">
            <BookOpen size={24} />
          </div>
          <h4 className="fs-6 fw-semibold text-dark mb-1">No study sessions yet</h4>
          <p className="text-secondary fs-7 mb-3" style={{ maxWidth: '300px' }}>
            Start asking questions about your study materials to build your learning history.
          </p>
          <button
            className="btn-primary-sa"
            onClick={() => navigate('/chat')}
          >
            <span>Start studying</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-sa h-100">
      <div className="card-sa-header">
        <div className="d-flex align-items-center gap-2">
          <BookOpen size={18} className="text-primary" />
          <h3 className="fs-6 fw-semibold mb-0">Continue Learning</h3>
        </div>
        <span className="badge-sa badge-sa-ready">Active Session</span>
      </div>
      <div className="card-sa-body d-flex flex-column justify-content-between">
        <div>
          <span className="text-muted text-uppercase fw-semibold fs-7 tracking-wider">
            {session.subject}
          </span>
          <h4 className="fs-5 fw-bold text-dark mt-1 mb-3">{session.topic}</h4>
          
          <div className="mb-3">
            <div className="d-flex justify-content-between text-secondary fs-7 mb-1">
              <span>Course Progress</span>
              <span className="fw-semibold text-dark">{session.progress}%</span>
            </div>
            <ProgressBar
              now={session.progress}
              variant="indigo"
              style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)' }}
            />
          </div>
        </div>

        <button
          className="btn-primary-sa w-100 justify-content-center mt-3"
          onClick={() => navigate('/chat')}
        >
          <span>Continue Session</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default ContinueLearning;
