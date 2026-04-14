const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Message = require('../models/Message');

// @GET /api/analytics/overview
exports.getOverview = async (req, res) => {
  try {
    let query = {};

    // ✅ FIX: Role-based filtering
    if (req.user.role === 'user') {
      query.submittedBy = req.user._id;
    }

    const [total, pending, inprogress, resolved] = await Promise.all([
      Complaint.countDocuments(query),
      Complaint.countDocuments({ ...query, status: 'pending' }),
      Complaint.countDocuments({ ...query, status: 'inprogress' }),
      Complaint.countDocuments({ ...query, status: 'resolved' }),
    ]);

    const [totalUsers, totalAgents] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'agent' }),
    ]);

    // Avg resolution time
    const resolvedComplaints = await Complaint.find({
      ...query,
      status: 'resolved',
      resolvedAt: { $ne: null }
    });

    let avgResolutionDays = 0;
    if (resolvedComplaints.length > 0) {
      const totalMs = resolvedComplaints.reduce(
        (sum, c) => sum + (c.resolvedAt - c.createdAt),
        0
      );
      avgResolutionDays = (
        totalMs /
        resolvedComplaints.length /
        (1000 * 60 * 60 * 24)
      ).toFixed(1);
    }

    const rated = await Complaint.find({
      ...query,
      'feedback.rating': { $ne: null }
    });

    const avgRating =
      rated.length > 0
        ? (
            rated.reduce((s, c) => s + c.feedback.rating, 0) /
            rated.length
          ).toFixed(1)
        : 0;

    res.json({
      success: true,
      stats: {
        total,
        pending,
        inprogress,
        resolved,
        totalUsers,
        totalAgents,
        resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
        avgResolutionDays: parseFloat(avgResolutionDays),
        avgRating: parseFloat(avgRating),
        totalRatings: rated.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/analytics/trends  (last 7 months)
exports.getTrends = async (req, res) => {
  try {
    const months = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    const trends = await Promise.all(months.map(async ({ year, month }) => {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      const [submitted, resolvedCount] = await Promise.all([
        Complaint.countDocuments({ createdAt: { $gte: start, $lt: end } }),
        Complaint.countDocuments({ resolvedAt: { $gte: start, $lt: end } }),
      ]);
      return {
        month: start.toLocaleString('default', { month: 'short' }) + ' ' + year,
        submitted,
        resolved: resolvedCount,
      };
    }));

    res.json({ success: true, trends });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/analytics/by-category
exports.getByCategory = async (req, res) => {
  try {
    const data = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, categories: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/analytics/by-priority
exports.getByPriority = async (req, res) => {
  try {
    const data = await Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, priorities: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/analytics/agent-performance
exports.getAgentPerformance = async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent', isActive: true }).select('name email');
    const performance = await Promise.all(agents.map(async (agent) => {
      const [assigned, resolved, inprogress] = await Promise.all([
        Complaint.countDocuments({ assignedTo: agent._id }),
        Complaint.countDocuments({ assignedTo: agent._id, status: 'resolved' }),
        Complaint.countDocuments({ assignedTo: agent._id, status: 'inprogress' }),
      ]);

      // Avg resolution time
      const resolvedC = await Complaint.find({ assignedTo: agent._id, status: 'resolved', resolvedAt: { $ne: null } });
      let avgDays = 0;
      if (resolvedC.length > 0) {
        const total = resolvedC.reduce((s, c) => s + (c.resolvedAt - c.createdAt), 0);
        avgDays = parseFloat((total / resolvedC.length / (1000 * 60 * 60 * 24)).toFixed(1));
      }

      return {
        agentId: agent._id,
        name: agent.name,
        email: agent.email,
        assigned,
        resolved,
        inprogress,
        resolutionRate: assigned > 0 ? Math.round((resolved / assigned) * 100) : 0,
        avgResolutionDays: avgDays,
      };
    }));

    res.json({ success: true, performance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
