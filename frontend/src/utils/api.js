import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,
});



// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('rn_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally → logout
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('rn_token');
      localStorage.removeItem('rn_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/update-profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
resetPassword: (token, data) => API.post(`/auth/reset-password/${token}`, data),
};

// ── Complaints ────────────────────────────────────────
export const complaintAPI = {
  create: (formData) => API.post('/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params) => API.get('/complaints', { params }),
  getOne: (id) => API.get(`/complaints/${id}`),
  update: (id, data) => API.put(`/complaints/${id}`, data),
  assign: (id, agentId) => API.put(`/complaints/${id}/assign`, { agentId }),
  delete: (id) => API.delete(`/complaints/${id}`),
  submitFeedback: (id, data) => API.post(`/complaints/${id}/feedback`, data),
};

// ── Chat ──────────────────────────────────────────────
export const chatAPI = {
  send: (data) => API.post('/chat', data),
  getMessages: (complaintId, params) => API.get(`/chat/${complaintId}`, { params }),
};

// ── Users ─────────────────────────────────────────────
export const userAPI = {
  getAll: (params) => API.get('/users', { params }),
  getAgents: () => API.get('/users/agents'),
  createAgent: (data) => API.post('/users/create-agent', data),
  update: (id, data) => API.put(`/users/${id}`, data),
  delete: (id) => API.delete(`/users/${id}`),
};

// ── Analytics ─────────────────────────────────────────
export const analyticsAPI = {
  getOverview: () => API.get('/analytics/overview'),
  getTrends: () => API.get('/analytics/trends'),
  getByCategory: () => API.get('/analytics/by-category'),
  getByPriority: () => API.get('/analytics/by-priority'),
  getAgentPerformance: () => API.get('/analytics/agent-performance'),
};

export default API;
