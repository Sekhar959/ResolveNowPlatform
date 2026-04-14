import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Basic matching check
    if (form.password !== form.confirmPassword) { 
      setError('Passwords do not match.'); 
      return; 
    }

    // 2. Email Validation (Regex matches your backend)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // 3. Password Strength (Stricter: 8 chars + Uppercase + Number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(form.password)) {
      setError('Password must be at least 8 characters, include an uppercase letter and a number.');
      return;
    }

    // 4. Phone Validation (Optional: matches your model's 10-digit rule)
    const phoneRegex = /^\d{10}$/;
    if (form.phone && !phoneRegex.test(form.phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true); 
    setError('');
    
    try {
      await register({ 
        name: form.name, 
        email: form.email, 
        password: form.password, 
        phone: form.phone 
      });
      addToast('Account created! Welcome to ResolveNow.', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1E293B 0%,#0F172A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 700, color: '#fff' }}>ResolveNow</h1>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 12 }}>Create your account</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: 32 }}>
          {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,.65)' }}>Full Name</label>
              <input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="John Smith" required style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#fff' }} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ color: 'rgba(255,255,255,.65)' }}>Email</label>
                <input className="form-control" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@email.com" required style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#fff' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: 'rgba(255,255,255,.65)' }}>Phone</label>
                <input className="form-control" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#fff' }} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ color: 'rgba(255,255,255,.65)' }}>Password</label>
                <input className="form-control" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" required style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#fff' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: 'rgba(255,255,255,.65)' }}>Confirm Password</label>
                <input className="form-control" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat password" required style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#fff' }} />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '11px', justifyContent: 'center' }}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,.35)' }}>
            Already have an account? <Link to="/login" style={{ color: '#60A5FA' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
