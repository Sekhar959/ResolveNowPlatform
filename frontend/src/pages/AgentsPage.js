import React, { useEffect, useState } from 'react';
import { userAPI, complaintAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function AgentsPage() {
  const { addToast } = useToast();
  const [agents, setAgents] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', email: '', password: '', phone: '' });
  const [creating, setCreating] = useState(false);
  const [assignModal, setAssignModal] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agentsRes, complaintsRes] = await Promise.all([
        userAPI.getAgents(),
        complaintAPI.getAll({ status: 'pending', limit: 50 }),
      ]);
      setAgents(agentsRes.data.agents);
      setUnassigned(complaintsRes.data.complaints.filter(c => !c.assignedTo));
    } catch { addToast('Failed to load data', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await userAPI.createAgent(newAgent);
      addToast('Agent created successfully!', 'success');
      setShowAddModal(false);
      setNewAgent({ name: '', email: '', password: '', phone: '' });
      fetchData();
    } catch (err) { addToast(err.response?.data?.message || 'Failed to create agent', 'error'); }
    finally { setCreating(false); }
  };

  const handleAssign = async () => {
    if (!selectedAgent) return;
    try {
      await complaintAPI.assign(assignModal._id, selectedAgent);
      addToast('Complaint assigned!', 'success');
      setAssignModal(null); setSelectedAgent('');
      fetchData();
    } catch (e) { addToast(e.response?.data?.message || 'Assignment failed', 'error'); }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate agent ${name}?`)) return;
    try {
      await userAPI.delete(id);
      addToast('Agent deactivated.', 'success');
      fetchData();
    } catch { addToast('Failed to deactivate', 'error'); }
  };

  const avatarColors = ['#DBEAFE', '#DCFCE7', '#FEF3C7', '#F3E8FF', '#FFE4E6'];
  const textColors = ['#1E40AF', '#166534', '#92400E', '#6B21A8', '#9F1239'];

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Manage Agents</h2>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add Agent</button>
      </div>

      {/* Agent cards */}
      <div className="agents-grid">
        {agents.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}><h3>No agents yet</h3><p>Add your first agent to get started.</p></div>
        ) : agents.map((agent, i) => (
          <div key={agent._id} className="agent-card">
            <div className="avatar" style={{ width: 48, height: 48, fontSize: 16, background: avatarColors[i % avatarColors.length], color: textColors[i % textColors.length] }}>
              {agent.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{agent.name}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>{agent.email}</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12 }}>
                <div>
                  <div style={{ color: '#94A3B8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Assigned</div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{agent.totalAssigned}</div>
                </div>
                <div>
                  <div style={{ color: '#94A3B8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Resolved</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#22C55E' }}>{agent.resolved}</div>
                </div>
                <div>
                  <div style={{ color: '#94A3B8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Rate</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#2563EB' }}>{agent.resolutionRate}%</div>
                </div>
              </div>
              {/* Mini progress bar */}
              <div style={{ height: 4, background: '#E2E8F0', borderRadius: 4, marginTop: 10 }}>
                <div style={{ height: '100%', width: `${agent.resolutionRate}%`, background: '#22C55E', borderRadius: 4, transition: 'width .5s' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-sm btn-danger" onClick={() => handleDeactivate(agent._id, agent.name)}>Deactivate</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Unassigned complaints */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Unassigned Complaints</span>
          <span style={{ marginLeft: 8, background: '#FEE2E2', color: '#991B1B', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>{unassigned.length}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#ID</th><th>Title</th><th>Category</th><th>Priority</th><th>Submitted By</th><th>Date</th><th>Assign</th></tr>
            </thead>
            <tbody>
              {unassigned.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><h3>All caught up! ✓</h3><p>No unassigned complaints.</p></div></td></tr>
              ) : unassigned.map(c => (
                <tr key={c._id}>
                  <td style={{ color: '#2563EB', fontWeight: 600, fontSize: 12 }}>{c.complaintId}</td>
                  <td style={{ maxWidth: 180 }}>{c.title}</td>
                  <td><span className="badge badge-cat">{c.category}</span></td>
                  <td><span className={`badge badge-${c.priority}`}>{c.priority}</span></td>
                  <td style={{ fontSize: 12 }}>{c.submittedBy?.name}</td>
                  <td style={{ fontSize: 12, color: '#64748B' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => { setAssignModal(c); setSelectedAgent(''); }}>Assign →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Agent Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Agent</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateAgent}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-control" value={newAgent.name} onChange={e => setNewAgent(a => ({ ...a, name: e.target.value }))} placeholder="Agent Name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-control" type="email" value={newAgent.email} onChange={e => setNewAgent(a => ({ ...a, email: e.target.value }))} placeholder="agent@resolvenow.in" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" value={newAgent.phone} onChange={e => setNewAgent(a => ({ ...a, phone: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-control" type="password" value={newAgent.password} onChange={e => setNewAgent(a => ({ ...a, password: e.target.value }))} placeholder="Min 6 characters" required minLength={6} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create Agent'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Assign Complaint</h3>
              <button className="modal-close" onClick={() => setAssignModal(null)}>×</button>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
              <strong>{assignModal.complaintId}</strong> – {assignModal.title}
            </p>
            <div className="form-group">
              <label className="form-label">Select Agent</label>
              <select className="form-control" value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}>
                <option value="">Choose an agent...</option>
                {agents.map(a => <option key={a._id} value={a._id}>{a.name} — {a.resolved}/{a.totalAssigned} resolved ({a.resolutionRate}%)</option>)}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAssignModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={!selectedAgent}>Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
