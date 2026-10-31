// Sends email.
// Production (Render Free blocks SMTP ports): Gmail API over HTTPS (port 443).
// Local fallback: Gmail SMTP via nodemailer, used only if Gmail API env vars are missing.
//
// Gmail API env vars: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, MAIL_FROM
// SMTP fallback env vars: MAIL_USER, MAIL_PASS

const nodemailer = require("nodemailer");

const REQUEST_TIMEOUT_MS = 10000;

let cachedAccessToken = null;
let cachedTokenExpiry = 0;

const useGmailApi = () =>
  Boolean(
    process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_CLIENT_SECRET &&
      process.env.GMAIL_REFRESH_TOKEN &&
      process.env.MAIL_FROM
  );

const fetchWithTimeout = async (url, options) => {
  if (typeof fetch !== "function") {
    throw new Error("Global fetch is not available. Use Node.js 18 or newer.");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const getAccessToken = async () => {
  // Reuse the token until 60s before it expires
  if (cachedAccessToken && Date.now() < cachedTokenExpiry - 60000) {
    return cachedAccessToken;
  }

  const res = await fetchWithTimeout("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID,
      client_secret: process.env.GMAIL_CLIENT_SECRET,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }).toString(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    // Only the error code is logged, never tokens
    throw new Error(
      `Gmail OAuth token request failed (${res.status}): ${data.error || "unknown_error"}`
    );
  }

  cachedAccessToken = data.access_token;
  cachedTokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
  return cachedAccessToken;
};

const encodeHeader = (text) =>
  `=?UTF-8?B?${Buffer.from(String(text), "utf8").toString("base64")}?=`;

const buildRawMessage = (to, subject, html) => {
  const bodyBase64 = Buffer.from(String(html), "utf8")
    .toString("base64")
    .replace(/(.{76})/g, "$1\r\n");

  const message = [
    `From: ${encodeHeader("StudyNotion")} <${process.env.MAIL_FROM}>`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    bodyBase64,
  ].join("\r\n");

  return Buffer.from(message, "utf8").toString("base64url");
};

const sendViaGmailApi = async (email, title, body) => {
  const accessToken = await getAccessToken();

  const res = await fetchWithTimeout(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: buildRawMessage(email, title, body) }),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) cachedAccessToken = null;
    throw new Error(
      `Gmail API send failed (${res.status}): ${data?.error?.message || "unknown_error"}`
    );
  }

  console.log("Email sent via Gmail API:", data.id);
  // Same shape callers already use (messageId / response)
  return { messageId: data.id, response: `Gmail API ${res.status}` };
};

const sendViaSmtp = async (email, title, body) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    connectionTimeout: REQUEST_TIMEOUT_MS,
    greetingTimeout: REQUEST_TIMEOUT_MS,
    socketTimeout: REQUEST_TIMEOUT_MS,
  });

  const info = await transporter.sendMail({
    from: `"StudyNotion" <${process.env.MAIL_USER}>`,
    to: email,
    subject: title,
    html: body,
  });

  console.log("Email sent via SMTP:", info.messageId);
  return info;
};

const mailSender = async (email, title, body) => {
  if (!email || /[\r\n]/.test(email)) {
    throw new Error("Invalid recipient email");
  }
  return useGmailApi()
    ? sendViaGmailApi(email, title, body)
    : sendViaSmtp(email, title, body);
};

module.exports = mailSender;
