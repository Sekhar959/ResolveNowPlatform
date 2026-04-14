const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintId: {
  type: String,
  unique: true,
  default: () => 'CMP' + Date.now()
},
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title too long'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description too long'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Infrastructure', 'Public Services', 'Sanitation', 'Utilities', 'Transport', 'Others'],
  },
  priority: {
    type: String,
    required: [true, 'Priority is required'],
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'inprogress', 'resolved'],
    default: 'pending',
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
  },
  imageUrl: {
    type: String,
    default: '',
  },
  imagePublicId: {
    type: String,
    default: '',
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  statusHistory: [{
    status: { type: String, enum: ['pending', 'inprogress', 'resolved'] },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  }],
  feedback: {
    rating: { type: Number, min: 1, max: 5, default: null },
    comment: { type: String, default: '' },
    submittedAt: { type: Date, default: null },
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

// Auto-generate complaintId before save
complaintSchema.pre('save', async function (next) {
  if (!this.complaintId) {
    const count = await mongoose.model('Complaint').countDocuments();
    this.complaintId = `CMP-${String(count + 1).padStart(4, '0')}`;
  }
  // Track status changes
  if (this.isModified('status') && !this.isNew) {
    if (this.status === 'resolved') this.resolvedAt = new Date();
  }
  next();
});

// Index for performance
complaintSchema.index({ status: 1, priority: 1 });
complaintSchema.index({ submittedBy: 1 });
complaintSchema.index({ assignedTo: 1 });
complaintSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
