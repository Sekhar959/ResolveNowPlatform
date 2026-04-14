import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', flexDirection: 'column', textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 80, marginBottom: 16 }}>🔍</div>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 48, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>404</h1>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#475569', marginBottom: 12 }}>Page Not Found</h2>
      <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 28, maxWidth: 340 }}>
        The page you're looking for doesn't exist or you don't have permission to view it.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>← Go Back</button>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 20px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Go to Dashboard</button>
      </div>
    </div>
  );
}
