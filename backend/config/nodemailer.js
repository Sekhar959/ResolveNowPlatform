const nodemailer = require('nodemailer');

/*
|--------------------------------------------------------------------------
| EMAIL CONFIGURATION
|--------------------------------------------------------------------------
*/

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// IMPORTANT:
// For Gmail, EMAIL_FROM should normally use the same Gmail account
// as EMAIL_USER unless you have configured a Gmail alias / Send As address.
const EMAIL_FROM =
  process.env.EMAIL_FROM || `ResolveNow <${EMAIL_USER || 'noreply@gmail.com'}>`;


/*
|--------------------------------------------------------------------------
| ENVIRONMENT VALIDATION
|--------------------------------------------------------------------------
*/

if (!EMAIL_USER) {
  console.error('❌ EMAIL_USER is missing in .env');
}

if (!EMAIL_PASS) {
  console.error('❌ EMAIL_PASS is missing in .env');
}

if (EMAIL_USER) {
  console.log('📧 Email account:', EMAIL_USER);
}


/*
|--------------------------------------------------------------------------
| NODEMAILER TRANSPORTER
|--------------------------------------------------------------------------
|
| Gmail SMTP:
| Host   : smtp.gmail.com
| Port   : 587
| Secure : false
|
| Port 587 uses STARTTLS.
|--------------------------------------------------------------------------
*/

const transporter = nodemailer.createTransport({
  service: 'gmail',

  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },

  /*
   * Connection timeouts
   * Helps prevent the backend from hanging if Gmail is unreachable.
   */
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 60000,

  /*
   * Debugging
   *
   * Keep logger false normally.
   * Change to true temporarily if you need SMTP-level debugging.
   */
  logger: false,
  debug: false,
});


/*
|--------------------------------------------------------------------------
| VERIFY EMAIL CONNECTION
|--------------------------------------------------------------------------
*/

const verifyEmailTransporter = async () => {
  try {
    if (!EMAIL_USER || !EMAIL_PASS) {
      console.error('❌ Email verification skipped.');
      console.error('   EMAIL_USER or EMAIL_PASS is missing.');
      return false;
    }

    await transporter.verify();

    console.log('========================================');
    console.log('✅ Nodemailer SMTP connection successful');
    console.log('📧 Email:', EMAIL_USER);
    console.log('📤 SMTP server: Gmail');
    console.log('========================================');

    return true;

  } catch (error) {
    console.error('========================================');
    console.error('❌ Nodemailer SMTP connection FAILED');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Response Code:', error.responseCode);
    console.error('Response:', error.response);
    console.error('Command:', error.command);
    console.error('========================================');

    return false;
  }
};


/*
|--------------------------------------------------------------------------
| SEND EMAIL
|--------------------------------------------------------------------------
*/

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    /*
     * Validate input
     */
    if (!to) {
      console.error('❌ Email failed: recipient address is missing.');
      return {
        success: false,
        error: 'Recipient email address is missing.',
      };
    }

    if (!subject) {
      console.error('❌ Email failed: subject is missing.');
      return {
        success: false,
        error: 'Email subject is missing.',
      };
    }

    if (!html && !text) {
      console.error('❌ Email failed: email content is missing.');
      return {
        success: false,
        error: 'Email content is missing.',
      };
    }


    /*
     * Log before sending
     */
    console.log('');
    console.log('========================================');
    console.log('📧 ATTEMPTING TO SEND EMAIL');
    console.log('========================================');
    console.log('To:', to);
    console.log('From:', EMAIL_FROM);
    console.log('Subject:', subject);
    console.log('SMTP User:', EMAIL_USER);


    /*
     * Send email
     */
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: to,
      subject: subject,

      // HTML email
      html: html || undefined,

      // Plain text fallback
      text:
        text ||
        'Please open this email in an HTML-compatible email client.',

      /*
       * Optional headers
       */
      headers: {
        'X-Mailer': 'ResolveNow Complaint Management System',
      },
    });


    /*
     * SMTP result
     */
    console.log('');
    console.log('✅ EMAIL SENT SUCCESSFULLY');
    console.log('----------------------------------------');
    console.log('Message ID:', info.messageId);
    console.log('Envelope:', info.envelope);
    console.log('Accepted:', info.accepted);
    console.log('Rejected:', info.rejected);
    console.log('SMTP Response:', info.response);
    console.log('----------------------------------------');
    console.log('');


    return {
      success: true,
      messageId: info.messageId,
      envelope: info.envelope,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    };

  } catch (error) {

    console.error('');
    console.error('========================================');
    console.error('❌ EMAIL SENDING FAILED');
    console.error('========================================');

    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Response Code:', error.responseCode);
    console.error('Response:', error.response);
    console.error('Command:', error.command);
    console.error('Rejected:', error.rejected);

    console.error('========================================');
    console.error('');

    return {
      success: false,
      error: error.message,
      code: error.code,
      responseCode: error.responseCode,
      response: error.response,
      command: error.command,
      rejected: error.rejected,
    };
  }
};


/*
|--------------------------------------------------------------------------
| EMAIL TEMPLATES
|--------------------------------------------------------------------------
*/

const emailTemplates = {

  /*
  |--------------------------------------------------------------------------
  | COMPLAINT REGISTERED
  |--------------------------------------------------------------------------
  */

  complaintSubmitted: (complaint, user) => ({

    subject: `Complaint Registered – ${complaint.complaintId}`,

    text: `
Dear ${user.name},

Your complaint has been successfully registered.

Complaint ID: ${complaint.complaintId}
Title: ${complaint.title}
Category: ${complaint.category}
Priority: ${complaint.priority}
Status: Pending

We will review your complaint and assign it to an agent shortly.

— ResolveNow Team
`,

    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Complaint Registered</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f8fafc;
  font-family:Arial,Helvetica,sans-serif;
">

  <div style="
    max-width:600px;
    margin:30px auto;
    background:#ffffff;
    border-radius:12px;
    overflow:hidden;
    border:1px solid #e2e8f0;
  ">

    <div style="
      background:#2563EB;
      padding:24px;
    ">

      <h1 style="
        color:#ffffff;
        margin:0;
        font-size:22px;
      ">
        ResolveNow
      </h1>

      <p style="
        color:#dbeafe;
        margin:6px 0 0;
        font-size:13px;
      ">
        Complaint Management System
      </p>

    </div>


    <div style="padding:24px;">

      <h2 style="
        color:#0f172a;
        font-size:18px;
        margin-top:0;
      ">
        Dear ${user.name},
      </h2>

      <p style="color:#64748b;">
        Your complaint has been successfully registered.
      </p>


      <div style="
        background:#f8fafc;
        border:1px solid #e2e8f0;
        border-radius:8px;
        padding:18px;
        margin:20px 0;
      ">

        <p>
          <strong>Complaint ID:</strong>
          <span style="color:#2563EB;">
            ${complaint.complaintId}
          </span>
        </p>

        <p>
          <strong>Title:</strong>
          ${complaint.title}
        </p>

        <p>
          <strong>Category:</strong>
          ${complaint.category}
        </p>

        <p>
          <strong>Priority:</strong>
          ${complaint.priority}
        </p>

        <p style="margin-bottom:0;">
          <strong>Status:</strong>
          <span style="color:#f59e0b;">
            Pending
          </span>
        </p>

      </div>


      <p style="
        color:#64748b;
        font-size:14px;
        line-height:1.6;
      ">
        We will review your complaint and assign it to an agent shortly.
        You can track the status by logging into your ResolveNow account.
      </p>


      <p style="
        color:#94a3b8;
        font-size:12px;
        margin-top:28px;
      ">
        — ResolveNow Team
      </p>

    </div>

  </div>

</body>
</html>
`,
  }),


  /*
  |--------------------------------------------------------------------------
  | STATUS UPDATED
  |--------------------------------------------------------------------------
  */

  statusUpdated: (complaint, user) => ({

    subject: `Complaint Status Updated – ${complaint.complaintId}`,

    text: `
Dear ${user.name},

Your complaint status has been updated.

Complaint ID: ${complaint.complaintId}
Title: ${complaint.title}
New Status: ${complaint.status}

Please log in to ResolveNow to view the latest details.

— ResolveNow Team
`,

    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Complaint Status Updated</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f8fafc;
  font-family:Arial,Helvetica,sans-serif;
">

  <div style="
    max-width:600px;
    margin:30px auto;
    background:#ffffff;
    border-radius:12px;
    overflow:hidden;
    border:1px solid #e2e8f0;
  ">

    <div style="
      background:#1E293B;
      padding:24px;
    ">

      <h1 style="
        color:#ffffff;
        margin:0;
        font-size:22px;
      ">
        ResolveNow
      </h1>

      <p style="
        color:#cbd5e1;
        margin:6px 0 0;
        font-size:13px;
      ">
        Complaint Management System
      </p>

    </div>


    <div style="padding:24px;">

      <h2 style="
        color:#0f172a;
        font-size:18px;
        margin-top:0;
      ">
        Complaint Status Update
      </h2>


      <p style="
        color:#64748b;
        line-height:1.6;
      ">
        Dear ${user.name},
      </p>


      <p style="
        color:#64748b;
        line-height:1.6;
      ">
        Your complaint
        <strong>${complaint.complaintId}</strong>
        has been updated.
      </p>


      <div style="
        background:#f8fafc;
        border:1px solid #e2e8f0;
        border-radius:8px;
        padding:18px;
        margin:20px 0;
      ">

        <p>
          <strong>Complaint ID:</strong>
          ${complaint.complaintId}
        </p>

        <p>
          <strong>Title:</strong>
          ${complaint.title}
        </p>

        <p style="margin-bottom:0;">
          <strong>New Status:</strong>

          <span style="
            color:#2563EB;
            font-weight:bold;
          ">
            ${complaint.status}
          </span>
        </p>

      </div>


      <p style="
        color:#64748b;
        font-size:14px;
        line-height:1.6;
      ">
        Please log in to your ResolveNow account to view the
        latest complaint details and status history.
      </p>


      <p style="
        color:#94a3b8;
        font-size:12px;
        margin-top:28px;
      ">
        — ResolveNow Team
      </p>

    </div>

  </div>

</body>
</html>
`,
  }),


  /*
  |--------------------------------------------------------------------------
  | COMPLAINT ASSIGNED
  |--------------------------------------------------------------------------
  */

  complaintAssigned: (complaint, agent) => ({

    subject: `New Complaint Assigned – ${complaint.complaintId}`,

    text: `
Hello ${agent.name},

A new complaint has been assigned to you.

Complaint ID: ${complaint.complaintId}
Title: ${complaint.title}
Priority: ${complaint.priority}

Please log in to ResolveNow to view and handle the complaint.

— ResolveNow Team
`,

    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Complaint Assigned</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f8fafc;
  font-family:Arial,Helvetica,sans-serif;
">

  <div style="
    max-width:600px;
    margin:30px auto;
    background:#ffffff;
    border-radius:12px;
    overflow:hidden;
    border:1px solid #e2e8f0;
  ">

    <div style="
      background:#1E293B;
      padding:24px;
    ">

      <h1 style="
        color:#ffffff;
        margin:0;
        font-size:22px;
      ">
        ResolveNow
      </h1>

      <p style="
        color:#cbd5e1;
        margin:6px 0 0;
        font-size:13px;
      ">
        Complaint Management System
      </p>

    </div>


    <div style="padding:24px;">

      <h2 style="
        color:#0f172a;
        font-size:18px;
        margin-top:0;
      ">
        New Complaint Assigned
      </h2>


      <p style="
        color:#64748b;
        line-height:1.6;
      ">
        Hello ${agent.name},
      </p>


      <p style="
        color:#64748b;
        line-height:1.6;
      ">
        A new complaint has been assigned to you.
      </p>


      <div style="
        background:#f8fafc;
        border:1px solid #e2e8f0;
        border-radius:8px;
        padding:18px;
        margin:20px 0;
      ">

        <p>
          <strong>Complaint ID:</strong>
          ${complaint.complaintId}
        </p>

        <p>
          <strong>Title:</strong>
          ${complaint.title}
        </p>

        <p style="margin-bottom:0;">
          <strong>Priority:</strong>
          ${complaint.priority}
        </p>

      </div>


      <p style="
        color:#64748b;
        font-size:14px;
        line-height:1.6;
      ">
        Please log in to ResolveNow to view and handle this complaint.
      </p>


      <p style="
        color:#94a3b8;
        font-size:12px;
        margin-top:28px;
      ">
        — ResolveNow Team
      </p>

    </div>

  </div>

</body>
</html>
`,
  }),
};


/*
|--------------------------------------------------------------------------
| VERIFY SMTP WHEN THIS FILE LOADS
|--------------------------------------------------------------------------
|
| This makes it immediately obvious in the backend terminal whether
| Gmail authentication/connection is working.
|--------------------------------------------------------------------------
*/

if (EMAIL_USER && EMAIL_PASS) {
  verifyEmailTransporter();
}


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {
  sendEmail,
  verifyEmailTransporter,
  emailTemplates,
};