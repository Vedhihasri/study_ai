import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Upload, NotebookPen, ClipboardCheck } from 'lucide-react';

const actions = [
  { id: 'chat', label: 'Ask AI Assistant', icon: MessageSquare, route: '/chat', desc: 'Query your documents' },
  { id: 'upload', label: 'Upload Document', icon: Upload, route: '/documents', desc: 'Add PDF, DOCX, TXT' },
  { id: 'notes', label: 'Generate Notes', icon: NotebookPen, route: '/notes', desc: 'Create study summaries' },
  { id: 'quiz', label: 'Create Quiz', icon: ClipboardCheck, route: '/quiz', desc: 'Practice test questions' }
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="card-sa h-100">
      <div className="card-sa-header">
        <h3 className="fs-6 fw-semibold mb-0">Quick Actions</h3>
      </div>
      <div className="card-sa-body">
        <div className="row g-3">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <div key={act.id} className="col-6">
                <button
                  className="w-100 text-start p-3 rounded-3 border bg-white card-sa-hover d-flex flex-column gap-2"
                  style={{ transition: 'all 0.15s ease' }}
                  onClick={() => navigate(act.route)}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div
                      className="p-2 rounded-2"
                      style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}
                    >
                      <Icon size={18} />
                    </div>
                  </div>
                  <div>
                    <div className="fw-semibold text-dark fs-7">{act.label}</div>
                    <div className="text-muted fs-7" style={{ fontSize: '0.75rem' }}>
                      {act.desc}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
