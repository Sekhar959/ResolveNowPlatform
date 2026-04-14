import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const avatarColors = { admin: '#DBEAFE', agent: '#DCFCE7', user: '#FEF3C7' };
  const textColors = { admin: '#1E40AF', agent: '#166534', user: '#92400E' };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await authAPI.updateProfile(profile);
      updateUser(data.user);
      addToast('Profile updated!', 'success');
    } catch (err) { addToast(err.response?.data?.message || 'Update failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) { addToast('Passwords do not match', 'error'); return; }
    if (passwords.newPassword.length < 6) { addToast('Password too short (min 6)', 'error'); return; }
    setChangingPw(true);
    try {
      await authAPI.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      addToast('Password changed successfully!', 'success');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { addToast(err.response?.data?.message || 'Failed to change password', 'error'); }
    finally { setChangingPw(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleBadge = { admin: 'badge-admin', agent: 'badge-agent', user: 'badge-user' }[user?.role] || 'badge-user';

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Profile header card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="avatar" style={{ width: 72, height: 72, fontSize: 26, background: avatarColors[user?.role], color: textColors[user?.role] }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{user?.name}</h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className={`badge ${roleBadge}`} style={{ textTransform: 'capitalize' }}>{user?.role}</span>
              <span style={{ fontSize: 12, color: '#64748B' }}>{user?.email}</span>
            </div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>Sign Out</button>
        </div>
      </div>

      {/* Edit profile */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">Edit Profile</span></div>
        <div className="card-body">
          <form onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" value={user?.email} disabled style={{ opacity: .6 }} />
              <div className="input-hint">Email cannot be changed.</div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <div className="card-header"><span className="card-title">Change Password</span></div>
        <div className="card-body">
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-control" type="password" value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} required placeholder="Current password" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-control" type="password" value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} required placeholder="Min 6 characters" minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input className="form-control" type="password" value={passwords.confirmPassword} onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} required placeholder="Repeat new password" />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={changingPw}>{changingPw ? 'Changing...' : 'Change Password'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
