const Message = require('../models/Message');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');

// @POST /api/chat
exports.sendMessage = async (req, res) => {
  try {
    const { complaintId, message } = req.body;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    // Access check: only submitter, assigned agent, or admin
    const isSubmitter = complaint.submittedBy.toString() === req.user._id.toString();
    const isAgent = complaint.assignedTo?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isSubmitter && !isAgent && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const msg = await Message.create({
      complaint: complaintId,
      sender: req.user._id,
      senderRole: req.user.role,
      message,
    });
    await msg.populate('sender', 'name role avatar');

    // Real-time emit to complaint room
    const io = req.app.get('io');
    if (io) {
      io.to(`complaint_${complaintId}`).emit('newMessage', {
        ...msg.toObject(),
        sender: { name: req.user.name, role: req.user.role },
      });
    }

    // Notify the other party
    let recipientId = null;
    if (isSubmitter && complaint.assignedTo) {
      recipientId = complaint.assignedTo;
    } else if ((isAgent || isAdmin) && complaint.submittedBy) {
      recipientId = complaint.submittedBy;
    }
    if (recipientId) {
      await Notification.create({
        recipient: recipientId,
        type: 'new_message',
        title: 'New Message',
        message: `${req.user.name}: ${message.slice(0, 60)}`,
        relatedComplaint: complaintId,
      });
      if (io) {
        io.to(`user_${recipientId}`).emit('newNotification', {
          type: 'new_message',
          message: `New message from ${req.user.name}`,
        });
      }
    }

    res.status(201).json({ success: true, message: 'Message sent.', data: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/chat/:complaintId
exports.getMessages = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const isSubmitter = complaint.submittedBy.toString() === req.user._id.toString();
    const isAgent = complaint.assignedTo?.toString() === req.user._id.toString();
    if (!isSubmitter && !isAgent && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const messages = await Message.find({ complaint: complaintId })
      .populate('sender', 'name role avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      { complaint: complaintId, sender: { $ne: req.user._id }, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
