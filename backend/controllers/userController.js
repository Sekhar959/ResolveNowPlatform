const User = require('../models/User');
const Complaint = require('../models/Complaint');

// @GET /api/users  (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    res.json({ success: true, total, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/users/agents  (admin only)
exports.getAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent', isActive: true }).select('name email phone assignedComplaints');

    // Enrich with stats
    const enriched = await Promise.all(agents.map(async (agent) => {
      const total = await Complaint.countDocuments({ assignedTo: agent._id });
      const resolved = await Complaint.countDocuments({ assignedTo: agent._id, status: 'resolved' });
      const pending = await Complaint.countDocuments({ assignedTo: agent._id, status: { $in: ['pending', 'inprogress'] } });
      return {
        _id: agent._id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        totalAssigned: total,
        resolved,
        pending,
        resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
      };
    }));

    res.json({ success: true, agents: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/users/create-agent  (admin only)
exports.createAgent = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already exists.' });

    const agent = await User.create({ name, email, password, phone, role: 'agent' });
    res.status(201).json({ success: true, message: 'Agent created.', agent: { _id: agent._id, name: agent.name, email: agent.email, role: agent.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/users/:id  (admin only)
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, role, isActive },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User updated.', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/users/:id  (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin.' });
    user.isActive = false;
    await user.save();
    res.json({ success: true, message: 'User deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
