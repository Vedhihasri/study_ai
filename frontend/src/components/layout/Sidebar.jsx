import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Offcanvas, Modal } from 'react-bootstrap';
import useAuth from '../../hooks/useAuth';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  NotebookPen,
  Layers,
  ClipboardCheck,
  Timer,
  BarChart3,
  Search,
  Settings,
  Sparkles,
  LogOut,
  UserCheck,
  Brain
} from 'lucide-react';

const mainNavItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/chat', label: 'AI Chat', icon: MessageSquare },
  {path: "/tutor",label: "AI Tutor",icon: Brain,},
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/notes', label: 'Notes', icon: NotebookPen },
  { path: '/flashcards', label: 'Flashcards', icon: Layers },
  { path: '/quiz', label: 'Quiz', icon: ClipboardCheck },
  { path: '/exam', label: 'Exam Mode', icon: Timer },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 }
];

const secondaryNavItems = [
  { path: '/search', label: 'Search', icon: Search },
  { path: '/settings', label: 'Settings', icon: Settings }
];

export const SidebarContent = ({ onItemClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Extract avatar initials
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'AI';

  return (
    <>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Sparkles size={18} />
        </div>
        <div>
          <h1 className="sidebar-brand-title">Study AI</h1>
          <span className="sidebar-brand-subtitle">Intelligent Study Companion</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="sidebar-nav">
        <div className="sidebar-nav-section-label">Main Menu</div>
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={onItemClick}
            >
              <Icon size={18} className="sidebar-icon" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div className="sidebar-nav-section-label mt-3">Tools & System</div>
        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={onItemClick}
            >
              <Icon size={18} className="sidebar-icon" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* User Profile Card & Logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user-card d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2 overflow-hidden">
            <div className="user-avatar-circle flex-shrink-0">
              {initials}
            </div>
            <div className="user-info-meta">
              <div className="user-name-text">{user?.name || 'Student'}</div>
              <div className="user-email-text">{user?.email || 'user@study.ai'}</div>
            </div>
          </div>

          <button
            className="btn-icon-sa text-danger hover-bg-danger-subtle ms-1"
            title="Sign Out"
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        show={showLogoutModal}
        onHide={() => setShowLogoutModal(false)}
        centered
        size="sm"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-6 fw-bold">Sign Out</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-secondary fs-7 py-3">
          Are you sure you want to sign out of your Study AI account?
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <button
            className="btn-secondary-sa py-1 px-3 fs-7"
            onClick={() => setShowLogoutModal(false)}
          >
            Cancel
          </button>
          <button
            className="btn-primary-sa bg-danger border-danger py-1 px-3 fs-7"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

const Sidebar = ({ showMobile, onHideMobile }) => {
  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <aside className="app-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile Offcanvas Drawer */}
      <Offcanvas
        show={showMobile}
        onHide={onHideMobile}
        responsive="lg"
        className="d-lg-none"
        style={{ maxWidth: '280px', backgroundColor: 'var(--bg-secondary)' }}
      >
        <Offcanvas.Header closeButton className="border-bottom">
          <div className="d-flex align-items-center gap-2">
            <div className="sidebar-brand-icon">
              <Sparkles size={16} />
            </div>
            <span className="fw-bold fs-6">Study AI</span>
          </div>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0 d-flex flex-column justify-content-between">
          <SidebarContent onItemClick={onHideMobile} />
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Sidebar;
