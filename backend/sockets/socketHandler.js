const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = (io) => {
  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user || !user.isActive) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.user.role}) [${socket.id}]`);

    // Join personal room for targeted notifications
    socket.join(`user_${socket.user._id}`);

    // Admin/agent join global admin room for new complaint alerts
    if (['admin', 'agent'].includes(socket.user.role)) {
      socket.join('admin_room');
    }

    // ── Complaint Room ──
    socket.on('joinComplaintRoom', (complaintId) => {
      socket.join(`complaint_${complaintId}`);
      console.log(`${socket.user.name} joined complaint room: ${complaintId}`);
    });

    socket.on('leaveComplaintRoom', (complaintId) => {
      socket.leave(`complaint_${complaintId}`);
    });

    // ── Typing Indicator ──
    socket.on('typing', ({ complaintId, isTyping }) => {
      socket.to(`complaint_${complaintId}`).emit('userTyping', {
        userId: socket.user._id,
        name: socket.user.name,
        isTyping,
      });
    });

    // ── Online Status ──
    socket.to('admin_room').emit('userOnline', {
      userId: socket.user._id,
      name: socket.user.name,
      role: socket.user.role,
    });

    // ── Admin: Live dashboard ping ──
    socket.on('requestDashboardStats', () => {
      if (['admin', 'agent'].includes(socket.user.role)) {
        socket.emit('dashboardStatsRequested', { timestamp: new Date() });
      }
    });

    // ── Disconnect ──
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.user.name} [${socket.id}]`);
      socket.to('admin_room').emit('userOffline', {
        userId: socket.user._id,
        name: socket.user.name,
      });
    });
  });
};
