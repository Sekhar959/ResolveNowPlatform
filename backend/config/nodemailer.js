const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'ResolveNow <noreply@resolvenow.in>',
      to,
      subject,
      html,
    });
    console.log('Email sent:', info.messageId);
    return { success: true };
  } catch (err) {
    console.error('Email error:', err.message);
    return { success: false, error: err.message };
  }
};

const emailTemplates = {
  complaintSubmitted: (complaint, user) => ({
    subject: `Complaint Registered – ${complaint.complaintId}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:12px">
        <div style="background:#2563EB;padding:20px 24px;border-radius:8px;margin-bottom:20px">
          <h1 style="color:#fff;margin:0;font-size:20px">ResolveNow</h1>
          <p style="color:rgba(255,255,255,.8);margin:4px 0 0;font-size:13px">Complaint Management System</p>
        </div>
        <h2 style="color:#0f172a;font-size:16px">Dear ${user.name},</h2>
        <p style="color:#64748b">Your complaint has been successfully registered.</p>
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0 0 8px"><strong>Complaint ID:</strong> <span style="color:#2563EB">${complaint.complaintId}</span></p>
          <p style="margin:0 0 8px"><strong>Title:</strong> ${complaint.title}</p>
          <p style="margin:0 0 8px"><strong>Category:</strong> ${complaint.category}</p>
          <p style="margin:0 0 8px"><strong>Priority:</strong> ${complaint.priority}</p>
          <p style="margin:0"><strong>Status:</strong> <span style="color:#f59e0b">Pending</span></p>
        </div>
        <p style="color:#64748b;font-size:13px">We will review your complaint and assign it to an agent shortly. You can track the status by logging into your account.</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">— ResolveNow Team</p>
      </div>
    `,
  }),

  statusUpdated: (complaint, user) => ({
    subject: `Complaint Status Updated – ${complaint.complaintId}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:12px">
        <div style="background:#1E293B;padding:20px 24px;border-radius:8px;margin-bottom:20px">
          <h1 style="color:#fff;margin:0;font-size:20px">ResolveNow</h1>
        </div>
        <h2 style="color:#0f172a;font-size:16px">Complaint Status Update</h2>
        <p style="color:#64748b">Your complaint <strong>${complaint.complaintId}</strong> status has been updated to: <strong style="color:#2563EB">${complaint.status}</strong></p>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">— ResolveNow Team</p>
      </div>
    `,
  }),

  complaintAssigned: (complaint, agent) => ({
    subject: `New Complaint Assigned – ${complaint.complaintId}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:12px">
        <div style="background:#1E293B;padding:20px 24px;border-radius:8px;margin-bottom:20px">
          <h1 style="color:#fff;margin:0;font-size:20px">ResolveNow</h1>
        </div>
        <h2 style="color:#0f172a;font-size:16px">New Complaint Assigned to You</h2>
        <p style="color:#64748b">Hello ${agent.name}, a new complaint has been assigned to you.</p>
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0 0 8px"><strong>Complaint ID:</strong> ${complaint.complaintId}</p>
          <p style="margin:0 0 8px"><strong>Title:</strong> ${complaint.title}</p>
          <p style="margin:0"><strong>Priority:</strong> ${complaint.priority}</p>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">— ResolveNow Team</p>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
