import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
  e.preventDefault();

  const validationError = validate();
    if (validationError) {
      setError(validationError);
      // Optional: Add a toast so they see it even if they aren't looking at the form
      addToast(validationError, 'error'); 
      return;
    }

  setError('');
  setLoading(true);

  try {
    await login(form);
    addToast('Welcome back!', 'success');
    navigate('/dashboard');
  } catch (err) {
    setError(err.response?.data?.message || 'Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const validate = () => {
    // 1. Stricter Email Regex (matches your backend)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return "Please enter a valid email address.";
    }

    // 2. Password Length (updated to 8 to match your new backend rule)
    if (form.password.length < 8) {
      return "Password must be at least 8 characters long.";
    }

    // 3. Password Complexity (Optional but recommended to match backend)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(form.password)) {
      return "Password must include an uppercase letter and a number.";
    }

    return null;
  };


  
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1E293B 0%,#0F172A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 42, height: 42, background: '#2563EB', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✓</div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 700, color: '#fff' }}>ResolveNow</h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 13 }}>Complaint Management System</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: 32 }}>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Sign In</h2>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, marginBottom: 20 }}>Enter your credentials to continue</p>

          

          {error && (
            <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,.65)' }}>Email</label>
              <input
                className="form-control"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                required
                style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#fff' }}
              />
        </div>
      <div className="password-field">
  <input
    className="form-control"
    name="password"
    type={showPassword ? "text" : "password"}
    placeholder="Enter password"
    value={form.password}
    onChange={handleChange}
    required
    style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#fff' }}
  />
  <span
    className="toggle-password"
    onClick={() => setShowPassword(!showPassword)}
  >
    {showPassword ? "Hide" : "Show"}
  </span>
        </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '11px', marginTop: 8, justifyContent: 'center' }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
  <Link 
    to="/forgot-password" 
    style={{ 
      color: '#60A5FA', // Use a blue color so it looks like a link
      fontSize: '13px', 
      textDecoration: 'underline', 
      cursor: 'pointer' 
    }}
  >
    Forgot Password?
  </Link>
</div>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,.35)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#60A5FA' }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
