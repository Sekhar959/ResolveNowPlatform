import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complaintAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSocket } from '../utils/socket';

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusNote, setStatusNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 0, comment: '' });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchComplaint = async () => {
    try {
      const { data } = await complaintAPI.getOne(id);
      setComplaint(data.complaint);
      setNewStatus(data.complaint.status);
    } catch {
      addToast('Failed to load complaint', 'error');
      navigate('/complaints');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaint(); }, [id]);

  // Real-time status updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (data) => {
      if (data.complaintId === id || data.complaintId === complaint?._id?.toString()) {
        fetchComplaint();
      }
    };
    socket.on('complaintUpdated', handler);
    socket.on('statusChanged', () => fetchComplaint());
    return () => { socket.off('complaintUpdated', handler); socket.off('statusChanged'); };
  }, [id, complaint?._id]);

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      await complaintAPI.update(id, { status: newStatus, note: statusNote });
      addToast('Status updated successfully!', 'success');
      setStatusNote('');
      fetchComplaint();
    } catch (e) { addToast(e.response?.data?.message || 'Update failed', 'error'); }
    finally { setUpdating(false); }
  };

  const handleFeedback = async () => {
    if (!feedback.rating) { addToast('Please select a rating', 'warning'); return; }
    setSubmittingFeedback(true);
    try {
      await complaintAPI.submitFeedback(id, feedback);
      addToast('Thank you for your feedback!', 'success');
      fetchComplaint();
    } catch (e) { addToast(e.response?.data?.message || 'Failed to submit feedback', 'error'); }
    finally { setSubmittingFeedback(false); }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!complaint) return null;

  const statusColor = { pending: '#F59E0B', inprogress: '#2563EB', resolved: '#22C55E' };
  const statusSteps = ['pending', 'inprogress', 'resolved'];

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/complaints')} style={{ marginBottom: 8 }}>← Back</button>
          <h2 className="section-title">{complaint.complaintId}</h2>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={`badge badge-${complaint.status}`}>{complaint.status === 'inprogress' ? 'In Progress' : complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}</span>
            <span className={`badge badge-${complaint.priority}`}>{complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)} Priority</span>
            <span className="badge badge-cat">{complaint.category}</span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate(`/chat/${complaint._id}`)}>
          💬 Open Chat
        </button>
      </div>

      <div className="detail-layout">
        {/* Left column */}
        <div>
          {/* Complaint info */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><span className="card-title">Complaint Details</span></div>
            <div className="card-body">
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{complaint.title}</h3>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, marginBottom: 20 }}>{complaint.description}</p>

              {/* Progress bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  {statusSteps.map((s, i) => (
                    <span key={s} style={{ fontSize: 11, fontWeight: 600, color: statusSteps.indexOf(complaint.status) >= i ? statusColor[s] : '#94A3B8', textTransform: 'capitalize' }}>
                      {s === 'inprogress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {statusSteps.map((s, i) => (
                    <div key={s} style={{ flex: 1, height: 5, borderRadius: 4, background: statusSteps.indexOf(complaint.status) >= i ? statusColor[s] : '#E2E8F0', transition: 'background .3s' }} />
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                {[
                  ['Submitted By', complaint.submittedBy?.name],
                  ['Assigned To', complaint.assignedTo?.name || 'Unassigned'],
                  ['Date Submitted', new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
                  ['Resolved At', complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleDateString('en-IN') : '—'],
                  ['Location', [complaint.address?.street, complaint.address?.city, complaint.address?.state].filter(Boolean).join(', ') || '—'],
                  ['Pincode', complaint.address?.pincode || '—'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontWeight: 500 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Image */}
          {complaint.imageUrl && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><span className="card-title">Attached Image</span></div>
              <div style={{ padding: 16 }}>
                <img src={complaint.imageUrl} alt="complaint" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 8 }} />
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>Hosted on Cloudinary</p>
              </div>
            </div>
          )}

          {/* Feedback (user only, resolved) */}
          {user.role === 'user' && complaint.status === 'resolved' && (
            complaint.feedback?.rating ? (
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header"><span className="card-title">Your Feedback</span></div>
                <div className="card-body">
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{'⭐'.repeat(complaint.feedback.rating)}</div>
                  <p style={{ fontSize: 13, color: '#475569' }}>{complaint.feedback.comment || 'No comment.'}</p>
                </div>
              </div>
            ) : (
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header"><span className="card-title">Leave Feedback</span></div>
                <div className="card-body">
                  <p style={{ fontSize: 13, color: '#64748B', marginBottom: 14 }}>How satisfied are you with the resolution?</p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    {[1, 2, 3, 4, 5].map(r => (
                      <button key={r} onClick={() => setFeedback(f => ({ ...f, rating: r }))} style={{ fontSize: 24, background: 'none', border: 'none', cursor: 'pointer', opacity: feedback.rating >= r ? 1 : 0.3, transition: 'opacity .15s' }}>⭐</button>
                    ))}
                  </div>
                  <div className="form-group">
                    <textarea className="form-control" placeholder="Share your experience (optional)..." value={feedback.comment} onChange={e => setFeedback(f => ({ ...f, comment: e.target.value }))} style={{ minHeight: 80 }} />
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={handleFeedback} disabled={submittingFeedback}>
                    {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Right column */}
        <div>
          {/* Update status (agent/admin) */}
          {['agent', 'admin'].includes(user.role) && complaint.status !== 'resolved' && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><span className="card-title">Update Status</span></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">New Status</label>
                  <select className="form-control" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="inprogress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Note (optional)</label>
                  <textarea className="form-control" value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="Add a note about this status change..." style={{ minHeight: 80 }} />
                </div>
                <button className="btn btn-primary" onClick={handleUpdateStatus} disabled={updating || newStatus === complaint.status} style={{ width: '100%', justifyContent: 'center' }}>
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="card">
            <div className="card-header"><span className="card-title">Activity Timeline</span></div>
            <div className="card-body">
              {complaint.statusHistory?.length > 0 ? (
                <div>
                  {[...complaint.statusHistory].reverse().map((h, i, arr) => (
                    <div key={i} className="timeline-item">
                      {i < arr.length - 1 && <div className="tl-line" />}
                      <div className="tl-dot" style={{ background: statusColor[h.status] || '#94A3B8' }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>
                          {h.status === 'inprogress' ? 'In Progress' : h.status.charAt(0).toUpperCase() + h.status.slice(1)}
                        </div>
                        {h.note && <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{h.note}</div>}
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>
                          {h.changedBy?.name && <span>{h.changedBy.name} · </span>}
                          {new Date(h.changedAt).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#94A3B8' }}>No history yet.</p>
              )}
            </div>
          </div>

          {/* Quick chat link */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
                {user.role === 'user' ? 'Chat with your assigned agent' : 'Chat with the complainant'}
              </p>
              <button className="btn btn-primary" onClick={() => navigate(`/chat/${complaint._id}`)} style={{ width: '100%', justifyContent: 'center' }}>
                Open Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
