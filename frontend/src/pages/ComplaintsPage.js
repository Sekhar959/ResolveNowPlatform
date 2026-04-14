import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintAPI, userAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSocket } from '../utils/socket';

export default function ComplaintsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', category: '', search: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [assignModal, setAssignModal] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const { data } = await complaintAPI.getAll(params);
      setComplaints(data.complaints);
      setTotalPages(data.pages);
    } catch (e) { addToast('Failed to load complaints', 'error'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  useEffect(() => {
    if (user.role === 'admin') {
      userAPI.getAgents().then(r => setAgents(r.data.agents)).catch(() => {});
    }
  }, [user.role]);

  // Real-time: refresh on new complaint
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => fetchComplaints();
    socket.on('complaintCreated', handler);
    socket.on('complaintUpdated', handler);
    return () => { socket.off('complaintCreated', handler); socket.off('complaintUpdated', handler); };
  }, [fetchComplaints]);

  const handleAssign = async () => {
    if (!selectedAgent) return;
    try {
      await complaintAPI.assign(assignModal._id, selectedAgent);
      addToast('Complaint assigned successfully!', 'success');
      setAssignModal(null); setSelectedAgent('');
      fetchComplaints();
    } catch (e) { addToast(e.response?.data?.message || 'Failed to assign', 'error'); }
  };

  const handleDelete = async () => {
    try {
      await complaintAPI.delete(deleteModal._id);
      addToast('Complaint deleted.', 'success');
      setDeleteModal(null);
      fetchComplaints();
    } catch (e) { addToast('Failed to delete', 'error'); }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await complaintAPI.update(id, { status });
      addToast(`Status updated to ${status}`, 'success');
      fetchComplaints();
    } catch (e) { addToast('Failed to update status', 'error'); }
  };

  const statusBadge = (s) => <span className={`badge badge-${s}`}>{s === 'inprogress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}</span>;
  const priorityBadge = (p) => <span className={`badge badge-${p}`}>{p.charAt(0).toUpperCase() + p.slice(1)}</span>;

  const CATEGORIES = ['Infrastructure', 'Public Services', 'Sanitation', 'Utilities', 'Transport', 'Others'];

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">{user.role === 'user' ? 'My Complaints' : 'All Complaints'}</h2>
        {user.role === 'user' && (
          <button className="btn btn-primary" onClick={() => navigate('/complaints/new')}>+ Submit Complaint</button>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <input className="search-input" placeholder="Search complaints..." value={filters.search} onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }} />
          {['', 'pending', 'inprogress', 'resolved'].map(s => (
            <button key={s} className={`filter-btn ${filters.status === s ? 'active' : ''}`} onClick={() => { setFilters(f => ({ ...f, status: s })); setPage(1); }}>
              {s === '' ? 'All Status' : s === 'inprogress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          {['', 'high', 'medium', 'low'].map(p => (
            <button key={p} className={`filter-btn ${filters.priority === p ? 'active' : ''}`} onClick={() => { setFilters(f => ({ ...f, priority: p })); setPage(1); }}>
              {p === '' ? 'All Priority' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          <select className="form-control" style={{ width: 160 }} value={filters.category} onChange={e => { setFilters(f => ({ ...f, category: e.target.value })); setPage(1); }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#ID</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th>
                  {user.role !== 'user' && <th>Submitted By</th>}
                  {user.role !== 'user' && <th>Assigned To</th>}
                  <th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr><td colSpan={9}>
                    <div className="empty-state"><h3>No complaints found</h3><p>Try adjusting your filters.</p></div>
                  </td></tr>
                ) : complaints.map(c => (
                  <tr key={c._id}>
                    <td style={{ color: '#2563EB', fontWeight: 600, fontSize: 12 }}>{c.complaintId}</td>
                    <td style={{ maxWidth: 200 }}>{c.title}</td>
                    <td><span className="badge badge-cat">{c.category}</span></td>
                    <td>{priorityBadge(c.priority)}</td>
                    <td>{statusBadge(c.status)}</td>
                    {user.role !== 'user' && <td style={{ fontSize: 12 }}>{c.submittedBy?.name}</td>}
                    {user.role !== 'user' && <td style={{ fontSize: 12, color: c.assignedTo ? '#0F172A' : '#94A3B8' }}>{c.assignedTo?.name || 'Unassigned'}</td>}
                    <td style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/complaints/${c._id}`)}>View</button>
                        {user.role === 'admin' && c.status !== 'resolved' && (
                          <button className="btn btn-sm btn-secondary" onClick={() => { setAssignModal(c); setSelectedAgent(''); }}>Assign</button>
                        )}
                        {['agent', 'admin'].includes(user.role) && c.status !== 'resolved' && (
                          <button className="btn btn-sm btn-secondary" onClick={() => handleUpdateStatus(c._id, c.status === 'pending' ? 'inprogress' : 'resolved')}>
                            {c.status === 'pending' ? '▶ Start' : '✓ Resolve'}
                          </button>
                        )}
                        {user.role === 'admin' && (
                          <button className="btn btn-sm btn-danger" onClick={() => setDeleteModal(c)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '12px 16px', display: 'flex', gap: 8, justifyContent: 'center', borderTop: '1px solid #E2E8F0' }}>
            <button className="btn btn-sm btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ padding: '5px 12px', fontSize: 13, color: '#64748B' }}>Page {page} of {totalPages}</span>
            <button className="btn btn-sm btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Assign Complaint</h3>
              <button className="modal-close" onClick={() => setAssignModal(null)}>×</button>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
              Assigning: <strong>{assignModal.complaintId} – {assignModal.title}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">Select Agent</label>
              <select className="form-control" value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}>
                <option value="">Choose an agent...</option>
                {agents.map(a => <option key={a._id} value={a._id}>{a.name} ({a.resolved}/{a.totalAssigned} resolved)</option>)}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAssignModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={!selectedAgent}>Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Complaint</h3>
              <button className="modal-close" onClick={() => setDeleteModal(null)}>×</button>
            </div>
            <p style={{ fontSize: 13 }}>Are you sure you want to delete <strong>{deleteModal.complaintId}</strong>? This action cannot be undone.</p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
