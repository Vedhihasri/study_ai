import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import useAuth from '../../hooks/useAuth';
import { Menu, Search, Bell, User, LogOut, Settings as SettingsIcon } from 'lucide-react';

const routeTitleMap = {
  '/': 'Overview',
  '/chat': 'AI Chat Assistant',
  '/documents': 'Study Documents',
  '/notes': 'Generated Notes',
  '/flashcards': 'Flashcards',
  '/quiz': 'Practice Quiz',
  '/exam': 'Exam Mode',
  '/analytics': 'Learning Analytics',
  '/search': 'Global Search',
  '/settings': 'Settings',
  '/login': 'Sign In',
  '/register': 'Create Account'
};

const Topbar = ({ onToggleMobileSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Determine current page title
  const currentTitle = routeTitleMap[location.pathname] || 'Study AI';

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'AI';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button
          className="btn-icon-sa d-lg-none"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <h2 className="topbar-page-title">{currentTitle}</h2>
      </div>

      <div className="topbar-right">
        {/* Quick Search Shortcut */}
        <button
          className="topbar-search-btn d-none d-sm-flex"
          onClick={() => navigate('/search')}
        >
          <Search size={15} />
          <span>Search study materials...</span>
          <kbd className="keyboard-shortcut-badge">⌘K</kbd>
        </button>

        {/* Notifications Button */}
        <button className="btn-icon-sa" title="Notifications">
          <Bell size={18} />
        </button>

        {/* User Profile Dropdown */}
        <Dropdown align="end">
          <Dropdown.Toggle
            as="button"
            className="btn p-0 border-0 bg-transparent"
            id="user-dropdown-toggle"
          >
            <div className="user-avatar-circle" style={{ width: 34, height: 34 }}>
              {initials}
            </div>
          </Dropdown.Toggle>

          <Dropdown.Menu className="shadow-dropdown border-0 mt-2 p-2" style={{ width: '220px' }}>
            <div className="px-3 py-2 border-bottom mb-1">
              <div className="fw-semibold text-dark fs-7">{user?.name || 'Student'}</div>
              <div className="text-muted fs-7 text-truncate">{user?.email || 'user@study.ai'}</div>
            </div>

            <Dropdown.Item
              className="d-flex align-items-center gap-2 rounded-2 fs-7 py-2"
              onClick={() => navigate('/settings')}
            >
              <SettingsIcon size={15} className="text-secondary" />
              <span>Account Settings</span>
            </Dropdown.Item>

            <Dropdown.Divider className="my-1" />

            <Dropdown.Item
              className="d-flex align-items-center gap-2 rounded-2 fs-7 py-2 text-danger"
              onClick={handleLogout}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </header>
  );
};

export default Topbar;
