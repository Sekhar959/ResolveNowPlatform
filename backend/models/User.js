const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name too long'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    // Improved Regex for stricter email validation
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    // Updated from 6 to 8 to match our Controller logic
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
    // Optional: Add regex for phone numbers (e.g., 10 digits)
    match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number'],
  },
  role: {
    type: String,
    enum: ['user', 'agent', 'admin'],
    default: 'user',
  },
  // ... rest of your existing fields ...
  isActive: {
    type: Boolean,
    default: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  assignedComplaints: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

// ... rest of your hooks and methods ...

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for initials
userSchema.virtual('initials').get(function () {
  return this.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

module.exports = mongoose.model('User', userSchema);
