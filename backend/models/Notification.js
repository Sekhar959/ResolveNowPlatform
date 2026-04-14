const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['complaint_created', 'complaint_updated', 'complaint_assigned', 'new_message', 'complaint_resolved'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedComplaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    default: null,
  },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
