import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (token) => {
  if (socket && socket.connected) return socket;

  socket = io(process.env.REACT_APP_SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => console.log('✅ Socket connected:', socket.id));
  socket.on('disconnect', (reason) => console.log('🔌 Socket disconnected:', reason));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinComplaintRoom = (complaintId) => {
  if (socket) socket.emit('joinComplaintRoom', complaintId);
};

export const leaveComplaintRoom = (complaintId) => {
  if (socket) socket.emit('leaveComplaintRoom', complaintId);
};

export const emitTyping = (complaintId, isTyping) => {
  if (socket) socket.emit('typing', { complaintId, isTyping });
};
