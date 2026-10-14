import React, { useEffect, useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/common/PageHeader';
import useAuth from '../hooks/useAuth';
import {
  UserRound,
  Palette,
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Check,
  AlertCircle,
} from 'lucide-react';

const THEME_KEY = 'study_ai_theme';

const Settings = () => {
  const { user, logout } = useAuth();

  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_KEY) || 'light'
  );
  const [message, setMessage] = useState('');

  const handleLogout = async () => {
    if (typeof logout !== 'function') {
      setMessage('Logout is not available through the authentication context.');
      return;
    }

    try {
      await logout();
    } catch {
      setMessage('Unable to log out. Please try again.');
    }
  };

  const displayName = user?.name || user?.full_name || 'Study AI User';
  const email = user?.email || 'Email not available';

  return (
    <PageContainer>
      <PageHeader
        title="Settings & Account"
        subtitle="Manage your profile, appearance, and account."
      />

      {message && (
        <div className="alert alert-warning d-flex align-items-center gap-2">
          <AlertCircle size={18} />
          <span>{message}</span>
        </div>
      )}

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <section className="card-sa p-4 mb-4">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="rounded-3 p-3 bg-light">
                <UserRound size={24} />
              </div>
              <div>
                <h5 className="mb-1">Profile</h5>
                <p className="text-secondary mb-0 small">
                  Your account information
                </p>
              </div>
            </div>

            <div className="d-flex align-items-center gap-3 mb-4">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                style={{
                  width: 58,
                  height: 58,
                  background: '#eee8ff',
                  color: '#6c4ccf',
                  fontSize: 22,
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h6 className="mb-1">{displayName}</h6>
                <p className="text-secondary mb-0">{email}</p>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Full name</label>
              <input
                className="form-control"
                value={displayName}
                readOnly
              />
            </div>

            <div>
              <label className="form-label">Email address</label>
              <input
                className="form-control"
                value={email}
                readOnly
              />
            </div>

            <p className="small text-secondary mt-3 mb-0">
              Profile details are read-only until a profile-update API is configured.
            </p>
          </section>
        </div>

        <div className="col-12 col-lg-4">
          <section className="card-sa p-4 mb-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <ShieldCheck size={23} />
              <h5 className="mb-0">Account</h5>
            </div>

            <p className="text-secondary small">
              Your account is protected by the application's authentication system.
            </p>

            <button
              type="button"
              className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Log out
            </button>
          </section>

          <section className="card-sa p-4">
            <h6 className="mb-2">Study AI</h6>
            <p className="text-secondary small mb-0">
              Your personal workspace for document search, AI tutoring,
              notes, flashcards, quizzes, and exam practice.
            </p>
          </section>
        </div>
      </div>
    </PageContainer>
  );
};

export default Settings;