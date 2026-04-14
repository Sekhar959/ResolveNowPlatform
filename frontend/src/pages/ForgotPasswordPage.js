import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      addToast('Reset link sent to your email!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1E293B 0%,#0F172A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        
        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 42, height: 42, background: '#2563EB', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff' }}>✓</div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 }}>ResolveNow</h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 13 }}>Complaint Management System</p>
        </div>

        {/* Form Card */}
        <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: 32 }}>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Forgot Password</h2>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, marginBottom: 20 }}>Enter your email to receive a password reset link</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: 'rgba(255,255,255,.65)', fontSize: 13, display: 'block', marginBottom: 8 }}>Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: 8, 
                  background: 'rgba(255,255,255,.08)', 
                  border: '1px solid rgba(255,255,255,.12)', 
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                width: '100%', 
                padding: '11px', 
                background: '#2563EB', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                fontWeight: 600, 
                cursor: loading ? 'not-allowed' : 'pointer' 
              }}
            >
              {loading ? 'Sending...' : 'Send Reset Link →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/login" style={{ color: '#60A5FA', fontSize: 12, textDecoration: 'none' }}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}