const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderRole: {
    type: String,
    enum: ['user', 'agent', 'admin'],
    required: true,
  },
  message: {
    type: String,
    required: [true, 'Message cannot be empty'],
    trim: true,
    maxlength: [1000, 'Message too long'],
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

messageSchema.index({ complaint: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
