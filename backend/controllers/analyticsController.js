const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Message = require('../models/Message');

/*
|--------------------------------------------------------------------------
| Helper: Get complaint filter based on logged-in user's role
|--------------------------------------------------------------------------
|
| Admin  -> sees all complaints
| User   -> sees only complaints submitted by themselves
| Agent  -> sees only complaints assigned to themselves
|
*/
const getComplaintQuery = (req) => {
  const query = {};

  if (req.user.role === 'user') {
    query.submittedBy = req.user._id;
  } else if (req.user.role === 'agent') {
    query.assignedTo = req.user._id;
  }

  return query;
};


// @GET /api/analytics/overview
exports.getOverview = async (req, res) => {
  try {
    const query = getComplaintQuery(req);

    // Complaint statistics
    const [total, pending, inprogress, resolved] = await Promise.all([
      Complaint.countDocuments(query),

      Complaint.countDocuments({
        ...query,
        status: 'pending',
      }),

      Complaint.countDocuments({
        ...query,
        status: 'inprogress',
      }),

      Complaint.countDocuments({
        ...query,
        status: 'resolved',
      }),
    ]);

    // System-wide user and agent counts
    const [totalUsers, totalAgents] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'agent' }),
    ]);

    // Average resolution time
    const resolvedComplaints = await Complaint.find({
      ...query,
      status: 'resolved',
      resolvedAt: { $ne: null },
    });

    let avgResolutionDays = 0;

    if (resolvedComplaints.length > 0) {
      const totalMs = resolvedComplaints.reduce(
        (sum, complaint) =>
          sum + (complaint.resolvedAt - complaint.createdAt),
        0
      );

      avgResolutionDays = (
        totalMs /
        resolvedComplaints.length /
        (1000 * 60 * 60 * 24)
      ).toFixed(1);
    }

    // Average feedback rating
    const rated = await Complaint.find({
      ...query,
      'feedback.rating': { $ne: null },
    });

    const avgRating =
      rated.length > 0
        ? (
            rated.reduce(
              (sum, complaint) =>
                sum + complaint.feedback.rating,
              0
            ) / rated.length
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

        resolutionRate:
          total > 0
            ? Math.round((resolved / total) * 100)
            : 0,

        avgResolutionDays: parseFloat(avgResolutionDays),

        avgRating: parseFloat(avgRating),

        totalRatings: rated.length,
      },
    });

  } catch (err) {
    console.error('Analytics overview error:', err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// @GET /api/analytics/trends
// Last 7 months
exports.getTrends = async (req, res) => {
  try {
    const query = getComplaintQuery(req);

    const months = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();

      d.setMonth(d.getMonth() - i);

      months.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
      });
    }

    const trends = await Promise.all(
      months.map(async ({ year, month }) => {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);

        const [submitted, resolvedCount] = await Promise.all([
          Complaint.countDocuments({
            ...query,
            createdAt: {
              $gte: start,
              $lt: end,
            },
          }),

          Complaint.countDocuments({
            ...query,
            resolvedAt: {
              $gte: start,
              $lt: end,
            },
          }),
        ]);

        return {
          month:
            start.toLocaleString('default', {
              month: 'short',
            }) +
            ' ' +
            year,

          submitted,

          resolved: resolvedCount,
        };
      })
    );

    res.json({
      success: true,
      trends,
    });

  } catch (err) {
    console.error('Analytics trends error:', err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// @GET /api/analytics/by-category
exports.getByCategory = async (req, res) => {
  try {
    const query = getComplaintQuery(req);

    const data = await Complaint.aggregate([
      // Apply role-based filtering first
      {
        $match: query,
      },

      // Group by category
      {
        $group: {
          _id: '$category',

          count: {
            $sum: 1,
          },

          resolved: {
            $sum: {
              $cond: [
                {
                  $eq: ['$status', 'resolved'],
                },
                1,
                0,
              ],
            },
          },
        },
      },

      // Highest complaint count first
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    res.json({
      success: true,
      categories: data,
    });

  } catch (err) {
    console.error('Analytics category error:', err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// @GET /api/analytics/by-priority
exports.getByPriority = async (req, res) => {
  try {
    const query = getComplaintQuery(req);

    const data = await Complaint.aggregate([
      // Apply role-based filtering first
      {
        $match: query,
      },

      // Group by priority
      {
        $group: {
          _id: '$priority',

          count: {
            $sum: 1,
          },
        },
      },

      // Highest count first
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    res.json({
      success: true,
      priorities: data,
    });

  } catch (err) {
    console.error('Analytics priority error:', err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// @GET /api/analytics/agent-performance
// @GET /api/analytics/agent-performance
exports.getAgentPerformance = async (req, res) => {
  try {
    const agents = await User.find({
      role: 'agent',
      isActive: true
    }).select('name email');

    const performance = await Promise.all(
      agents.map(async (agent) => {

        // Basic performance counts
        const [assigned, resolved, inprogress] = await Promise.all([
          Complaint.countDocuments({
            assignedTo: agent._id
          }),

          Complaint.countDocuments({
            assignedTo: agent._id,
            status: 'resolved'
          }),

          Complaint.countDocuments({
            assignedTo: agent._id,
            status: 'inprogress'
          })
        ]);

        // Average resolution time
        const resolvedComplaints = await Complaint.find({
          assignedTo: agent._id,
          status: 'resolved',
          resolvedAt: { $ne: null }
        });

        let avgResolutionDays = 0;

        if (resolvedComplaints.length > 0) {
          const totalMs = resolvedComplaints.reduce(
            (sum, complaint) =>
              sum + (complaint.resolvedAt - complaint.createdAt),
            0
          );

          avgResolutionDays = parseFloat(
            (
              totalMs /
              resolvedComplaints.length /
              (1000 * 60 * 60 * 24)
            ).toFixed(1)
          );
        }

        // -----------------------------------------
        // USER RATING FOR THIS AGENT
        // -----------------------------------------
        const ratedComplaints = await Complaint.find({
          assignedTo: agent._id,
          status: 'resolved',
          'feedback.rating': { $ne: null }
        }).select('feedback.rating');

        let avgRating = 0;

        if (ratedComplaints.length > 0) {
          const totalRating = ratedComplaints.reduce(
            (sum, complaint) =>
              sum + complaint.feedback.rating,
            0
          );

          avgRating = parseFloat(
            (totalRating / ratedComplaints.length).toFixed(1)
          );
        }

        return {
          agentId: agent._id,
          name: agent.name,
          email: agent.email,

          // Complaint performance
          assigned,
          resolved,
          inprogress,

          resolutionRate:
            assigned > 0
              ? Math.round((resolved / assigned) * 100)
              : 0,

          avgResolutionDays,

          // User feedback performance
          avgRating,
          totalRatings: ratedComplaints.length
        };
      })
    );

    res.json({
      success: true,
      performance
    });

  } catch (err) {
    console.error('Agent performance error:', err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};