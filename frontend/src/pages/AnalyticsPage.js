import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { analyticsAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const CustomLegend = ({ items }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 12 }}>
    {items.map(([color, label]) => (
      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748B' }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
        {label}
      </div>
    ))}
  </div>
);

export default function AnalyticsPage() {
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [agentPerf, setAgentPerf] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.getOverview(),
      analyticsAPI.getTrends(),
      analyticsAPI.getByCategory(),
      analyticsAPI.getByPriority(),
      analyticsAPI.getAgentPerformance(),
    ]).then(([s, t, c, p, a]) => {
      setStats(s.data.stats);
      setTrends(t.data.trends);
      setCategories(c.data.categories);
      setPriorities(p.data.priorities);
      setAgentPerf(a.data.performance);
    }).catch(() => addToast('Failed to load analytics', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const baseOpts = { responsive: true, maintainAspectRatio: false, plugins: { CustomLegend: { display: false } } };
  const gridOpts = { ...baseOpts, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,.04)' } } } };

  const CAT_COLORS = ['#2563EB', '#22C55E', '#F59E0B', '#8B5CF6', '#EF4444', '#64748B'];
  const PRI_COLORS = { high: '#EF4444', medium: '#F59E0B', low: '#22C55E' };

  const trendData = {
    labels: trends.map(t => t.month),
    datasets: [
      { label: 'Submitted', data: trends.map(t => t.submitted), borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,.07)', fill: true, tension: 0.4, pointBackgroundColor: '#2563EB', pointRadius: 4 },
      { label: 'Resolved', data: trends.map(t => t.resolved), borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,.07)', fill: false, tension: 0.4, pointBackgroundColor: '#22C55E', pointRadius: 4 },
    ],
  };

  const catData = {
    labels: categories.map(c => c._id),
    datasets: [{ data: categories.map(c => c.count), backgroundColor: CAT_COLORS, borderWidth: 0 }],
  };

  const priData = {
    labels: priorities.map(p => p._id.charAt(0).toUpperCase() + p._id.slice(1)),
    datasets: [{ data: priorities.map(p => p.count), backgroundColor: priorities.map(p => PRI_COLORS[p._id] || '#64748B'), borderWidth: 0, borderRadius: 4, borderSkipped: false }],
  };

  const agentBarData = {
    labels: agentPerf.map(a => a.name.split(' ')[0]),
    datasets: [
      { label: 'Assigned', data: agentPerf.map(a => a.assigned), backgroundColor: '#DBEAFE', borderRadius: 4 },
      { label: 'Resolved', data: agentPerf.map(a => a.resolved), backgroundColor: '#2563EB', borderRadius: 4 },
    ],
  };

  const resTimeData = {
    labels: agentPerf.map(a => a.name.split(' ')[0]),
    datasets: [{ data: agentPerf.map(a => a.avgResolutionDays), backgroundColor: '#8B5CF6', borderRadius: 6, borderSkipped: false }],
  };

  const statusData = {
    labels: ['Pending', 'In Progress', 'Resolved'],
    datasets: [{ data: [stats?.pending, stats?.inprogress, stats?.resolved], backgroundColor: ['#F59E0B', '#2563EB', '#22C55E'], borderWidth: 0, borderRadius: 4 }],
  };

  return (
    <div>
      {/* KPI cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">Avg Resolution Time</div>
          <div className="stat-number">{stats?.avgResolutionDays ?? '—'}<span style={{ fontSize: 16, fontWeight: 500 }}>d</span></div>
          <div className="stat-change up">Days per complaint</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Resolution Rate</div>
          <div className="stat-number">{stats?.resolutionRate ?? 0}<span style={{ fontSize: 16, fontWeight: 500 }}>%</span></div>
          <div className="stat-change up">Of all complaints</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">User Satisfaction</div>
          <div className="stat-number">{stats?.avgRating ?? '—'}<span style={{ fontSize: 16, fontWeight: 500 }}>/5</span></div>
          <div className="stat-change up">Based on {stats?.totalRatings} ratings</div>
        </div>
      </div>

      {/* Trends + Status */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Monthly Complaint Trends</div>
          <CustomLegend items={[['#2563EB', 'Submitted'], ['#22C55E', 'Resolved']]} />
          <div style={{ position: 'relative', height: 200 }}>
            <Line data={trendData} options={gridOpts} />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Status Distribution</div>
          <CustomLegend items={[['#F59E0B', `Pending (${stats?.pending})`], ['#2563EB', `In Progress (${stats?.inprogress})`], ['#22C55E', `Resolved (${stats?.resolved})`]]} />
          <div style={{ position: 'relative', height: 180 }}>
            <Doughnut data={statusData} options={{ ...baseOpts, cutout: '65%' }} />
          </div>
        </div>
      </div>

      {/* Category + Priority */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">By Category</div>
          <CustomLegend items={categories.map((c, i) => [CAT_COLORS[i % CAT_COLORS.length], `${c._id} (${c.count})`])} />
          <div style={{ position: 'relative', height: 200 }}>
            <Pie data={catData} options={baseOpts} />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">By Priority</div>
          <CustomLegend items={priorities.map(p => [PRI_COLORS[p._id], `${p._id.charAt(0).toUpperCase() + p._id.slice(1)} (${p.count})`])} />
          <div style={{ position: 'relative', height: 200 }}>
            <Bar data={priData} options={gridOpts} />
          </div>
        </div>
      </div>

      {/* Agent performance */}
      {agentPerf.length > 0 && (
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-title">Agent Performance (Assigned vs Resolved)</div>
            <CustomLegend items={[['#DBEAFE', 'Assigned'], ['#2563EB', 'Resolved']]} />
            <div style={{ position: 'relative', height: 180 }}>
              <Bar data={agentBarData} options={gridOpts} />
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title">Avg Resolution Time per Agent (days)</div>
            <div style={{ position: 'relative', height: 180 }}>
              <Bar data={resTimeData} options={{ ...gridOpts, scales: { ...gridOpts.scales, y: { ...gridOpts.scales.y, title: { display: true, text: 'Days', font: { size: 11 } } } } }} />
            </div>
          </div>
        </div>
      )}

      {/* Agent table */}
      {agentPerf.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title">Agent Leaderboard</span></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Rank</th><th>Agent</th><th>Assigned</th><th>Resolved</th><th>Pending</th><th>Rate</th><th>Avg Time</th></tr>
              </thead>
              <tbody>
                {[...agentPerf].sort((a, b) => b.resolutionRate - a.resolutionRate).map((a, i) => (
                  <tr key={a.agentId}>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{a.name}</td>
                    <td>{a.assigned}</td>
                    <td style={{ color: '#22C55E', fontWeight: 600 }}>{a.resolved}</td>
                    <td style={{ color: '#F59E0B' }}>{a.inprogress}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 5, background: '#E2E8F0', borderRadius: 4, minWidth: 60 }}>
                          <div style={{ height: '100%', width: `${a.resolutionRate}%`, background: '#22C55E', borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{a.resolutionRate}%</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{a.avgResolutionDays}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
