# ResolveNow – Complaint Management System

A production-grade full-stack web application for online complaint registration, tracking, and resolution with real-time updates and chat.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js, React Router v6, Chart.js, Socket.io Client |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Real-Time | Socket.io |
| Auth | JWT + bcryptjs |
| File Upload | Multer + Cloudinary |
| Email | Nodemailer |
| Styling | Custom CSS (DM Sans + Syne fonts) |

---

## 📁 Project Structure

```
ResolveNow/
├── backend/
│   ├── config/
│   │   ├── cloudinary.js        # Cloudinary + Multer setup
│   │   └── nodemailer.js        # Email templates & transporter
│   ├── controllers/
│   │   ├── authController.js    # Register, Login, Profile
│   │   ├── complaintController.js # Full CRUD + assign + feedback
│   │   ├── chatController.js    # Send & fetch messages
│   │   ├── userController.js    # Admin: manage users/agents
│   │   └── analyticsController.js # Stats, trends, performance
│   ├── middleware/
│   │   └── auth.js              # JWT protect + authorize + generateToken
│   ├── models/
│   │   ├── User.js              # User schema (bcrypt pre-save)
│   │   ├── Complaint.js         # Complaint + statusHistory + feedback
│   │   ├── Message.js           # Chat messages
│   │   └── Notification.js      # In-app notifications
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── complaintRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── userRoutes.js
│   │   └── analyticsRoutes.js
│   ├── sockets/
│   │   └── socketHandler.js     # Socket.io events, rooms, typing
│   ├── uploads/                 # Local fallback (Cloudinary preferred)
│   ├── server.js                # Express + Socket.io + MongoDB entry
│   ├── seed.js                  # Demo data seeder
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/shared/
│   │   │   └── Layout.js        # Sidebar, Topbar, socket listeners
│   │   ├── context/
│   │   │   ├── AuthContext.js   # Global auth state + socket init
│   │   │   └── ToastContext.js  # Toast notifications
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── DashboardPage.js   # Stats + Charts + Recent table
│   │   │   ├── ComplaintsPage.js  # Filter, search, CRUD table
│   │   │   ├── ComplaintDetailPage.js # Timeline, status update, feedback
│   │   │   ├── SubmitComplaintPage.js # Form + drag-drop image upload
│   │   │   ├── ChatPage.js        # Real-time chat with rooms
│   │   │   ├── AgentsPage.js      # Agent cards + assignment table
│   │   │   ├── AnalyticsPage.js   # 6 charts + leaderboard
│   │   │   ├── ProfilePage.js     # Edit profile + change password
│   │   │   └── NotFoundPage.js
│   │   ├── utils/
│   │   │   ├── api.js             # Axios instance + all API calls
│   │   │   └── socket.js          # Socket.io client utility
│   │   ├── App.js                 # Router + Protected routes
│   │   ├── index.js
│   │   └── index.css              # Global styles + design system
│   ├── .env.example
│   └── package.json
│
├── package.json                   # Root scripts (concurrently)
├── .gitignore
└── README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Cloudinary account (free tier works)
- Gmail account (for Nodemailer)

---

### 1. Clone & Install

```bash
# Install all dependencies (root + backend + frontend)
npm run install-all
```

---

### 2. Configure Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/resolvenow
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d

# Cloudinary (from cloudinary.com dashboard)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Gmail (enable App Password in Google Account settings)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password
EMAIL_FROM=ResolveNow <noreply@resolvenow.in>

FRONTEND_URL=http://localhost:3000
```

```bash
# Frontend
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

---

### 3. Seed Demo Data

```bash
npm run seed
```

This creates:
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@resolvenow.in | Admin@123 |
| Agent | ravi@resolvenow.in | Agent@123 |
| Agent | priya@resolvenow.in | Agent@123 |
| User | john@example.com | User@123 |

---

### 4. Run the Application

```bash
# Run both frontend and backend simultaneously
npm run dev
```

Or separately:
```bash
npm run start:backend   # Backend on :5000
npm run start:frontend  # Frontend on :3000
```

Open: **http://localhost:3000**

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Any | Get current user |
| PUT | `/api/auth/update-profile` | Any | Update name/phone |
| PUT | `/api/auth/change-password` | Any | Change password |

### Complaints
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/complaints` | User | Submit complaint (with image) |
| GET | `/api/complaints` | Any | Get all (role-filtered) |
| GET | `/api/complaints/:id` | Any | Get single complaint |
| PUT | `/api/complaints/:id` | Agent/Admin | Update status/details |
| PUT | `/api/complaints/:id/assign` | Admin | Assign to agent |
| DELETE | `/api/complaints/:id` | Admin | Delete complaint |
| POST | `/api/complaints/:id/feedback` | User | Submit rating |

### Chat
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/chat` | Any | Send message |
| GET | `/api/chat/:complaintId` | Any | Get chat history |

### Users (Admin)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/users` | Admin | All users |
| GET | `/api/users/agents` | Admin | Agents with stats |
| POST | `/api/users/create-agent` | Admin | Create agent account |
| PUT | `/api/users/:id` | Admin | Update user |
| DELETE | `/api/users/:id` | Admin | Deactivate user |

### Analytics (Admin/Agent)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/analytics/overview` | Admin/Agent | KPI stats |
| GET | `/api/analytics/trends` | Admin | 7-month trend |
| GET | `/api/analytics/by-category` | Admin | Category breakdown |
| GET | `/api/analytics/by-priority` | Admin | Priority breakdown |
| GET | `/api/analytics/agent-performance` | Admin | Agent leaderboard |

---

## ⚡ Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `complaintCreated` | Server → Client | New complaint submitted |
| `complaintUpdated` | Server → Client | Status/assignment changed |
| `newMessage` | Server → Room | New chat message |
| `newNotification` | Server → User | Personal notification |
| `statusChanged` | Server → Room | Status update in chat room |
| `userTyping` | Server → Room | Typing indicator |
| `joinComplaintRoom` | Client → Server | Join complaint chat room |
| `leaveComplaintRoom` | Client → Server | Leave chat room |
| `typing` | Client → Server | User is typing |

---

## 🎨 Color Design System

| Token | Color | Usage |
|-------|-------|-------|
| Primary | `#2563EB` | Buttons, links, active states |
| Secondary | `#1E293B` | Sidebar, headers |
| Background | `#F8FAFC` | Page background |
| Card | `#FFFFFF` | Card surfaces |
| Success | `#22C55E` | Resolved status |
| Warning | `#F59E0B` | Pending status |
| Danger | `#EF4444` | High priority, errors |
| Text | `#0F172A` | Primary text |
| Muted | `#64748B` | Secondary text |

---

## 🔒 Security Features

- JWT authentication with configurable expiry
- bcryptjs password hashing (cost factor 12)
- Role-based route authorization (user / agent / admin)
- Input validation and sanitization
- CORS configured for specific frontend origin
- Cloudinary-based image storage (no local sensitive files)
- Socket.io JWT middleware authentication

---

## 📊 Features Summary

- ✅ Multi-role authentication (User, Agent, Admin)
- ✅ Complaint CRUD with priority, category, address, image
- ✅ Cloudinary image upload with Multer
- ✅ Real-time updates via Socket.io
- ✅ Room-based chat per complaint with typing indicators
- ✅ Admin dashboard: assign complaints to agents
- ✅ Agent dashboard: view assigned, update status
- ✅ Analytics with 6 Chart.js visualizations
- ✅ Agent leaderboard with resolution rate
- ✅ Email notifications via Nodemailer
- ✅ Complaint status timeline history
- ✅ User feedback/rating for resolved complaints
- ✅ Pagination, search, multi-filter on complaints
- ✅ Responsive design (mobile-ready)
- ✅ Toast notifications system
- ✅ Protected routes by role

---

## 🚀 Production Deployment

### Backend (Railway / Render / Heroku)
1. Set all environment variables in the platform dashboard
2. Set `NODE_ENV=production`
3. Update `FRONTEND_URL` to your deployed frontend URL

### Frontend (Vercel / Netlify)
1. Set `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` to backend URL
2. Run `npm run build` → deploy the `frontend/build` folder

### MongoDB
- Use MongoDB Atlas free tier
- Update `MONGO_URI` with Atlas connection string

---

*Built with ❤️ – ResolveNow v1.0.0*
