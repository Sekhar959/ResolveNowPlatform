import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getSocket } from '../../utils/socket';

const NavItem = ({ to, icon, label, badge }) => (
  <NavLink to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
    <span style={{ fontSize: 16 }}>{icon}</span>
    {label}
    {badge > 0 && <span className="nav-badge">{badge}</span>}
  </NavLink>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Page title map
  const titles = {
    '/dashboard': 'Dashboard Overview',
    '/complaints': 'All Complaints',
    '/complaints/new': 'Submit Complaint',
    '/chat': 'Chat & Messages',
    '/agents': 'Manage Agents',
    '/analytics': 'Analytics',
    '/profile': 'My Profile',
  };
  const pageTitle = titles[location.pathname] || 'ResolveNow';

  // Socket listeners for real-time notifications
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onComplaintCreated = (data) => {
      if (user.role !== 'user') {
        addToast(`New complaint: "${data.title}"`, 'info');
        setUnreadNotifs(n => n + 1);
      }
    };
    const onComplaintUpdated = (data) => {
      addToast(`Complaint ${data.complaintId || ''} updated to ${data.status}`, 'success');
    };
    const onNewMessage = () => setUnreadMessages(n => n + 1);
    const onNewNotification = (data) => {
      addToast(data.message, 'info');
      setUnreadNotifs(n => n + 1);
    };

    socket.on('complaintCreated', onComplaintCreated);
    socket.on('complaintUpdated', onComplaintUpdated);
    socket.on('newMessage', onNewMessage);
    socket.on('newNotification', onNewNotification);

    return () => {
      socket.off('complaintCreated', onComplaintCreated);
      socket.off('complaintUpdated', onComplaintUpdated);
      socket.off('newMessage', onNewMessage);
      socket.off('newNotification', onNewNotification);
    };
  }, [user, addToast]);

  // Clear unread on page visit
  useEffect(() => {
    if (location.pathname === '/chat') setUnreadMessages(0);
  }, [location.pathname]);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const avatarColors = { admin: '#DBEAFE', agent: '#DCFCE7', user: '#FEF3C7' };
  const avatarTextColors = { admin: '#1E40AF', agent: '#166534', user: '#92400E' };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>ResolveNow</h1>
          <span>
            {user?.role === 'admin' ? 'Admin Portal' : user?.role === 'agent' ? 'Agent Portal' : 'User Portal'}
          </span>
        </div>

        <nav className="nav-section">
          <div className="nav-label">Main</div>
          <NavItem to="/dashboard" icon="⊞" label="Dashboard" />
          <NavItem to="/complaints" icon="📋" label={user?.role === 'user' ? 'My Complaints' : 'All Complaints'} />
          {user?.role === 'user' && (
            <NavItem to="/complaints/new" icon="➕" label="Submit Complaint" />
          )}
          <NavItem to="/chat" icon="💬" label="Chat" badge={unreadMessages} />
        </nav>

        {(user?.role === 'admin' || user?.role === 'agent') && (
          <nav className="nav-section">
            <div className="nav-label">{user.role === 'admin' ? 'Admin' : 'Agent'}</div>
            {user?.role === 'admin' && (
              <NavItem to="/agents" icon="👥" label="Manage Agents" />
            )}
            <NavItem to="/analytics" icon="📊" label="Analytics" badge={unreadNotifs} />
          </nav>
        )}

        <nav className="nav-section">
          <div className="nav-label">Account</div>
          <NavItem to="/profile" icon="👤" label="Profile" />
          <div className="nav-item" onClick={() => { logout(); navigate('/login'); }} style={{ cursor: 'pointer' }}>
            <span>🚪</span> Sign Out
          </div>
        </nav>

        <div className="sidebar-user">
          <div
            className="avatar"
            style={{
              width: 32, height: 32, fontSize: 12,
              background: avatarColors[user?.role] || '#EFF6FF',
              color: avatarTextColors[user?.role] || '#1E40AF',
            }}
          >
            {initials}
          </div>
          <div>
            <div className="user-name">{user?.name}</div>
            <div className="user-role" style={{ textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar-title">{pageTitle}</div>
            <div className="topbar-sub" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="online-dot" />
              <span>Live</span>
              <span style={{ marginLeft: 8 }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div
              className="avatar"
              style={{ width: 34, height: 34, fontSize: 13, background: avatarColors[user?.role], color: avatarTextColors[user?.role], cursor: 'pointer' }}
              onClick={() => navigate('/profile')}
              title="Profile"
            >
              {initials}
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
