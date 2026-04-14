import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { analyticsAPI, complaintAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socket';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [recent, setRecent] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const socket = getSocket();
  if (!socket) return;

  const refresh = () => {
    analyticsAPI.getOverview().then(res => {
      setStats(res.data.stats);
    });
  };

  socket.on('complaintCreated', refresh);
  socket.on('complaintUpdated', refresh);

  return () => {
    socket.off('complaintCreated', refresh);
    socket.off('complaintUpdated', refresh);
  };
}, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, complaintsRes] = await Promise.all([
          analyticsAPI.getOverview(),
          complaintAPI.getAll({ limit: 6 }),
        ]);
        setStats(statsRes.data.stats);
        setRecent(complaintsRes.data.complaints);
        if (user.role === 'admin') {
          const [trendsRes, catRes] = await Promise.all([
            analyticsAPI.getTrends(),
            analyticsAPI.getByCategory(),
          ]);
          setTrends(trendsRes.data.trends);
          setByCategory(catRes.data.categories);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user.role]);

  const statusBadge = (s) => ({ pending: 'badge badge-pending', inprogress: 'badge badge-inprogress', resolved: 'badge badge-resolved' }[s] || 'badge');
  const priorityBadge = (p) => ({ high: 'badge badge-high', medium: 'badge badge-medium', low: 'badge badge-low' }[p] || 'badge');

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const lineData = {
    labels: trends.map(t => t.month),
    datasets: [
      { label: 'Submitted', data: trends.map(t => t.submitted), borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,.07)', fill: true, tension: 0.4, pointBackgroundColor: '#2563EB', pointRadius: 4 },
      { label: 'Resolved', data: trends.map(t => t.resolved), borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,.07)', fill: false, tension: 0.4, pointBackgroundColor: '#22C55E', pointRadius: 4 },
    ],
  };

  const doughnutData = {
    labels: ['Pending', 'In Progress', 'Resolved'],
    datasets: [{ data: [stats?.pending, stats?.inprogress, stats?.resolved], backgroundColor: ['#F59E0B', '#2563EB', '#22C55E'], borderWidth: 0, borderRadius: 4 }],
  };

  const barData = {
    labels: byCategory.map(c => c._id),
    datasets: [{ data: byCategory.map(c => c.count), backgroundColor: '#2563EB', borderRadius: 6, borderSkipped: false }],
  };

  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,.04)' } } } };
  const doughnutOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '68%' };

  return (
    <div>
      {/* Stat cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Complaints</div>
          <div className="stat-number" style={{ color: '#2563EB' }}>{stats?.total ?? 0}</div>
          <div className="stat-change neutral">All time</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-number" style={{ color: '#F59E0B' }}>{stats?.pending ?? 0}</div>
          <div className="stat-change neutral">{stats?.total ? Math.round((stats.pending / stats.total) * 100) : 0}% of total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Progress</div>
          <div className="stat-number" style={{ color: '#3B82F6' }}>{stats?.inprogress ?? 0}</div>
          <div className="stat-change up">Active cases</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Resolved</div>
          <div className="stat-number" style={{ color: '#22C55E' }}>{stats?.resolved ?? 0}</div>
          <div className="stat-change up">{stats?.resolutionRate ?? 0}% rate</div>
        </div>
      </div>

      {/* Charts (admin/agent only) */}
      {user.role !== 'user' && trends.length > 0 && (
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-title">Complaint Trends</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              {[['#2563EB', 'Submitted'], ['#22C55E', 'Resolved']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748B' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />{l}
                </div>
              ))}
            </div>
            <div style={{ position: 'relative', height: 180 }}>
              <Line data={lineData} options={chartOpts} />
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title">Status Distribution</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              {[['#F59E0B', 'Pending'], ['#2563EB', 'In Progress'], ['#22C55E', 'Resolved']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748B' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />{l}
                </div>
              ))}
            </div>
            <div style={{ position: 'relative', height: 160 }}>
              <Doughnut data={doughnutData} options={doughnutOpts} />
            </div>
          </div>
          {byCategory.length > 0 && (
            <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
              <div className="chart-title">Complaints by Category</div>
              <div style={{ position: 'relative', height: 160 }}>
                <Bar data={barData} options={chartOpts} />
              </div>
            </div>
          )}
        </div>
      )}

    
      {/* Recent complaints table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Complaints</span>
          <button className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => navigate('/complaints')}>View All →</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#ID</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Date</th><th></th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={7} className="empty-state">No complaints yet.</td></tr>
              ) : recent.map(c => (
                <tr key={c._id}>
                  <td style={{ color: '#2563EB', fontWeight: 600, fontSize: 12 }}>{c.complaintId}</td>
                  <td style={{ maxWidth: 200 }}>{c.title}</td>
                  <td><span className="badge badge-cat">{c.category}</span></td>
                  <td><span className={priorityBadge(c.priority)}>{c.priority}</span></td>
                  <td><span className={statusBadge(c.status)}>{c.status === 'inprogress' ? 'In Progress' : c.status}</span></td>
                  <td style={{ color: '#64748B', fontSize: 12 }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                  <td><button className="btn btn-sm btn-secondary" onClick={() => navigate(`/complaints/${c._id}`)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
