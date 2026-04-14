const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail, emailTemplates } = require('../config/nodemailer');
const { cloudinary } = require('../config/cloudinary');

// Helper: create notification
const createNotification = async (recipientId, type, title, message, complaintId = null) => {
  try {
    await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      relatedComplaint: complaintId,
    });
  } catch (e) {
    console.error('Notification error:', e.message);
  }
};

// @POST /api/complaints
exports.createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority, street, city, state, pincode } = req.body;

    const complaintData = {
      title,
      description,
      category,
      priority: priority || 'medium',
      address: { street, city, state, pincode },
      submittedBy: req.user._id,
      statusHistory: [{ status: 'pending', changedBy: req.user._id, note: 'Complaint submitted' }],
    };

    if (req.file) {
      complaintData.imageUrl = req.file.path;
      complaintData.imagePublicId = req.file.filename;
    }

    const complaint = await Complaint.create(complaintData);
    await complaint.populate('submittedBy', 'name email');

    // Notify admins
    const admins = await User.find({ role: 'admin', isActive: true });
    for (const admin of admins) {
      await createNotification(
        admin._id,
        'complaint_created',
        'New Complaint Submitted',
        `${req.user.name} submitted: "${title}"`,
        complaint._id
      );
    }

    // Send confirmation email
    const emailData = emailTemplates.complaintSubmitted(complaint, req.user);
    await sendEmail({ to: req.user.email, ...emailData });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) io.emit('complaintCreated', complaint);

    res.status(201).json({ success: true, message: 'Complaint submitted successfully.', complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/complaints
exports.getComplaints = async (req, res) => {
  try {
    const { status, priority, category, assignedTo, page = 1, limit = 20, search } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role === 'user') {
      query.submittedBy = req.user._id;
    } else if (req.user.role === 'agent') {
      query.assignedTo = req.user._id;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedTo) query.assignedTo = assignedTo;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { complaintId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate('submittedBy', 'name email phone')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      complaints,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/complaints/:id
exports.getComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('submittedBy', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate('statusHistory.changedBy', 'name role');

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    // Access control
    if (req.user.role === 'user' && complaint.submittedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (req.user.role === 'agent' && complaint.assignedTo?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/complaints/:id
exports.updateComplaint = async (req, res) => {
  try {
    const { status, note, title, description, priority } = req.body;
    const complaint = await Complaint.findById(req.params.id).populate('submittedBy', 'name email');

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    // Only admin/agent can update status
    if (status && ['agent', 'admin'].includes(req.user.role)) {
      complaint.statusHistory.push({ status, changedBy: req.user._id, note: note || '' });
      complaint.status = status;
      if (status === 'resolved') complaint.resolvedAt = new Date();

      // Notify the user who submitted
      await createNotification(
        complaint.submittedBy._id,
        'complaint_updated',
        'Complaint Status Updated',
        `Your complaint "${complaint.title}" is now ${status}.`,
        complaint._id
      );

      // Email notification
      const emailData = emailTemplates.statusUpdated(complaint, complaint.submittedBy);
      await sendEmail({ to: complaint.submittedBy.email, ...emailData });

      // Emit real-time event
      const io = req.app.get('io');
      if (io) {
        io.emit('complaintUpdated', { complaintId: complaint._id, status, updatedBy: req.user.name });
        io.to(`complaint_${complaint._id}`).emit('statusChanged', { status, note });
      }
    }

    if (title && req.user.role === 'admin') complaint.title = title;
    if (description && req.user.role === 'admin') complaint.description = description;
    if (priority && ['agent', 'admin'].includes(req.user.role)) complaint.priority = priority;

    await complaint.save();
    res.json({ success: true, message: 'Complaint updated.', complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/complaints/:id/assign
exports.assignComplaint = async (req, res) => {
  try {
    const { agentId } = req.body;
    const agent = await User.findById(agentId);
    if (!agent || agent.role !== 'agent') {
      return res.status(400).json({ success: false, message: 'Invalid agent.' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { assignedTo: agentId, status: 'inprogress' },
      { new: true }
    ).populate('submittedBy', 'name email').populate('assignedTo', 'name email');

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    // Add to agent's assigned list
    await User.findByIdAndUpdate(agentId, { $addToSet: { assignedComplaints: complaint._id } });

    // Notify agent
    await createNotification(agentId, 'complaint_assigned', 'New Complaint Assigned', `"${complaint.title}" has been assigned to you.`, complaint._id);

    // Email agent
    const emailData = emailTemplates.complaintAssigned(complaint, agent);
    await sendEmail({ to: agent.email, ...emailData });

    // Real-time emit
    const io = req.app.get('io');
    if (io) {
      io.emit('complaintUpdated', { complaintId: complaint._id, status: 'inprogress', assignedTo: agent.name });
      io.to(`user_${agentId}`).emit('complaintAssigned', complaint);
    }

    res.json({ success: true, message: `Complaint assigned to ${agent.name}.`, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/complaints/:id
exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    // Delete image from Cloudinary if exists
    if (complaint.imagePublicId) {
      await cloudinary.uploader.destroy(complaint.imagePublicId);
    }

    await complaint.deleteOne();
    res.json({ success: true, message: 'Complaint deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/complaints/:id/feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    if (complaint.status !== 'resolved') {
      return res.status(400).json({ success: false, message: 'Can only rate resolved complaints.' });
    }
    if (complaint.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    complaint.feedback = { rating, comment, submittedAt: new Date() };
    await complaint.save();
    res.json({ success: true, message: 'Feedback submitted. Thank you!', complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
