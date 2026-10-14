import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { Sparkles, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Spinner } from 'react-bootstrap';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3 p-md-4">
      <div
        className="card-sa w-100 overflow-hidden shadow-lg"
        style={{ maxWidth: '960px', borderRadius: 'var(--radius-xl)' }}
      >
        <div className="row g-0">
          {/* Left Panel: Desktop Visual Hero */}
          <div
            className="col-12 col-md-6 p-4 p-lg-5 d-none d-md-flex flex-column justify-content-between text-white"
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #4338CA 100%)',
              position: 'relative'
            }}
          >
            <div>
              <div className="d-flex align-items-center gap-2 mb-4">
                <div
                  className="bg-white text-primary p-2 rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: 38, height: 38 }}
                >
                  <Sparkles size={20} />
                </div>
                <span className="fw-bold fs-5 text-white">Study AI</span>
              </div>
              <h1 className="display-6 fw-bold text-white mb-3" style={{ lineHeight: 1.2 }}>
                Elevate your learning with AI.
              </h1>
              <p className="text-white-50 fs-6 mb-4">
                Ask grounded questions, extract instant notes, and practice quizzes directly from your course materials.
              </p>
            </div>

            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center gap-3 bg-white bg-opacity-10 p-3 rounded-3 border border-white border-opacity-10">
                <CheckCircle2 size={20} className="text-warning flex-shrink-0" />
                <span className="fs-7 text-white">Grounded RAG responses with page-level citations</span>
              </div>
              <div className="d-flex align-items-center gap-3 bg-white bg-opacity-10 p-3 rounded-3 border border-white border-opacity-10">
                <CheckCircle2 size={20} className="text-warning flex-shrink-0" />
                <span className="fs-7 text-white">Automated flashcards & progress tracking</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Login Form */}
          <div className="col-12 col-md-6 p-4 p-lg-5 bg-white d-flex flex-column justify-content-center">
            {/* Mobile Brand Header */}
            <div className="d-md-none text-center mb-4">
              <div
                className="bg-primary text-white p-2 rounded-3 d-inline-flex align-items-center justify-content-center mb-2"
                style={{ width: 40, height: 40 }}
              >
                <Sparkles size={20} />
              </div>
              <h2 className="fs-4 fw-bold mb-0">Study AI</h2>
            </div>

            <div className="mb-4">
              <h2 className="fs-3 fw-bold text-dark mb-1">Welcome back</h2>
              <p className="text-secondary fs-6 mb-0">Continue your learning journey.</p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 fs-7 mb-4 border-0 bg-danger bg-opacity-10 text-danger rounded-3">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-secondary fs-7 fw-medium mb-1">Email Address</label>
                <input
                  type="email"
                  className="form-control py-2 px-3 fs-7"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label text-secondary fs-7 fw-medium mb-0">Password</label>
                </div>
                <div className="position-relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control py-2 px-3 fs-7 pe-5"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-secondary p-2 me-1 text-decoration-none"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary-sa w-100 justify-content-center py-2.5 fs-6 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" me={2} />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="text-center fs-7 text-secondary mt-3">
              Don't have an account?{' '}
              <Link to="/register" className="fw-semibold text-primary text-decoration-none ms-1">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
