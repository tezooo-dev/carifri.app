/**
 * Email service — uses nodemailer with configurable SMTP transport.
 *
 * Environment variables:
 *   SMTP_HOST     e.g. smtp.gmail.com | smtp.sendgrid.net | mail.your-domain.com
 *   SMTP_PORT     e.g. 587 (TLS) or 465 (SSL) — default 587
 *   SMTP_USER     your SMTP username / Gmail address
 *   SMTP_PASS     your SMTP password / app password / API key
 *   SMTP_FROM     "FreightLink TMS <no-reply@yourcompany.com>"
 *   APP_URL       https://app.yourcompany.com  (used in email links)
 *
 * Gmail quick start:
 *   1. Enable 2FA on your Google account
 *   2. Generate an App Password (Google → Security → App Passwords)
 *   3. Set SMTP_HOST=smtp.gmail.com SMTP_USER=you@gmail.com SMTP_PASS=<app-password>
 *
 * SendGrid quick start:
 *   SMTP_HOST=smtp.sendgrid.net SMTP_PORT=587 SMTP_USER=apikey SMTP_PASS=<sg-api-key>
 */

const nodemailer = require('nodemailer');

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('⚠️  Email not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
    return null;
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' },
  });

  return _transporter;
}

const FROM = () => process.env.SMTP_FROM || `"FreightLink TMS" <no-reply@freightlink.app>`;
const APP_URL = () => process.env.APP_URL || 'http://localhost:5173';

async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log(`📧 [DEV — email not configured] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await t.sendMail({ from: FROM(), to, subject, html, text });
  } catch (err) {
    console.error(`❌ Email send failed to ${to}:`, err.message);
  }
}

// ── Templates ─────────────────────────────────────────────────────────────────

function wrap(title, body) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f1f5f9; margin:0; padding:32px 16px; color:#1e293b; }
  .card { background:#fff; border-radius:16px; max-width:520px; margin:0 auto; padding:40px; box-shadow:0 4px 24px rgba(0,0,0,.06); }
  .logo { display:flex; align-items:center; gap:10px; margin-bottom:32px; }
  .logo-box { width:36px; height:36px; background:#2563eb; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:13px; }
  .logo-name { font-weight:800; font-size:18px; color:#0f172a; }
  h2 { font-size:22px; font-weight:800; color:#0f172a; margin:0 0 8px; }
  p  { color:#475569; font-size:15px; line-height:1.6; margin:0 0 16px; }
  .btn { display:inline-block; background:#2563eb; color:#fff !important; text-decoration:none; padding:13px 28px; border-radius:10px; font-weight:700; font-size:15px; margin:8px 0 24px; }
  .muted { color:#94a3b8; font-size:13px; }
  .footer { text-align:center; margin-top:32px; color:#94a3b8; font-size:12px; }
  hr { border:none; border-top:1px solid #e2e8f0; margin:24px 0; }
</style>
</head><body>
<div class="card">
  <div class="logo">
    <div class="logo-box">FL</div>
    <span class="logo-name">FreightLink TMS</span>
  </div>
  ${body}
  <div class="footer">© ${new Date().getFullYear()} FreightLink TMS · <a href="${APP_URL()}/privacy" style="color:#94a3b8">Privacy</a> · <a href="${APP_URL()}/terms" style="color:#94a3b8">Terms</a></div>
</div></body></html>`;
}

function sendWelcome({ name, email, role, market }) {
  const subject = `Welcome to FreightLink TMS, ${name.split(' ')[0]}!`;
  const dashUrl  = `${APP_URL()}/dashboard`;
  const guideUrl = `${APP_URL()}/guide`;
  return sendMail({
    to: email,
    subject,
    html: wrap(subject, `
      <h2>Welcome aboard, ${name.split(' ')[0]}! 🎉</h2>
      <p>Your FreightLink TMS account is ready. You're set up as <strong>${role === 'admin' ? 'Administrator' : 'Operations'}</strong> for the <strong>${market.charAt(0).toUpperCase() + market.slice(1)}</strong> market.</p>
      <a href="${dashUrl}" class="btn">Open Dashboard →</a>
      <hr>
      <p class="muted">New to FreightLink? Read the <a href="${guideUrl}">User Guide</a> to get up and running in minutes.</p>
      <p class="muted">Your login: <strong>${email}</strong></p>
    `),
    text: `Welcome ${name}! Your FreightLink TMS account is ready. Login at ${dashUrl}`,
  });
}

function sendPasswordReset({ name, email, resetUrl }) {
  const subject = 'Reset your FreightLink TMS password';
  return sendMail({
    to: email,
    subject,
    html: wrap(subject, `
      <h2>Password Reset Request</h2>
      <p>Hi ${name.split(' ')[0]}, we received a request to reset your password. Click the button below to set a new password.</p>
      <a href="${resetUrl}" class="btn">Reset Password →</a>
      <p class="muted">This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your password won't change.</p>
    `),
    text: `Reset your FreightLink TMS password: ${resetUrl}\n\nThis link expires in 1 hour.`,
  });
}

function sendLoadNotification({ recipientEmail, recipientName, event, load, extra = {} }) {
  const templates = {
    bid_received: {
      subject: `New bid on load ${load.id}`,
      body: `
        <h2>New carrier bid received</h2>
        <p>A carrier has submitted a bid on load <strong>${load.id}</strong> (${load.origin} → ${load.destination}).</p>
        <p><strong>Bid amount:</strong> ${extra.currency || ''} ${extra.amount?.toLocaleString() || ''}</p>
        <a href="${APP_URL()}/loads" class="btn">Review Bids →</a>
      `,
    },
    load_booked: {
      subject: `Load ${load.id} assigned to carrier`,
      body: `
        <h2>Load booked ✅</h2>
        <p>Load <strong>${load.id}</strong> (${load.origin} → ${load.destination}) has been assigned to <strong>${extra.carrierName || 'a carrier'}</strong>.</p>
        <a href="${APP_URL()}/loads" class="btn">View Load →</a>
      `,
    },
    load_picked_up: {
      subject: `Load ${load.id} picked up — In Transit`,
      body: `
        <h2>Shipment picked up 🚛</h2>
        <p>Load <strong>${load.id}</strong> (${load.origin} → ${load.destination}) has been picked up and is now in transit.</p>
        <a href="${APP_URL()}/tracking" class="btn">Track Live →</a>
      `,
    },
    load_delivered: {
      subject: `Load ${load.id} delivered ✅`,
      body: `
        <h2>Delivery confirmed 🎉</h2>
        <p>Load <strong>${load.id}</strong> (${load.origin} → ${load.destination}) has been successfully delivered.</p>
        <p>Remember to mark the commission as received once payment is confirmed.</p>
        <a href="${APP_URL()}/finance" class="btn">View Finance →</a>
      `,
    },
  };

  const tpl = templates[event];
  if (!tpl) return Promise.resolve();
  return sendMail({
    to: recipientEmail,
    subject: tpl.subject,
    html: wrap(tpl.subject, tpl.body),
    text: tpl.subject,
  });
}

module.exports = { sendWelcome, sendPasswordReset, sendLoadNotification };
