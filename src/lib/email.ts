import { Resend } from "resend";
import { dbAll, dbGet } from "./db";

const RESEND_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_KEY
  ? new Resend(RESEND_KEY)
  : null;

console.log(`[email] RESEND_API_KEY=${RESEND_KEY ? RESEND_KEY.slice(0, 6) + "..." : "NOT SET"}`);

const FROM = process.env.EMAIL_FROM || "Stinkout <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://stinkout.vercel.app";

export type EmailLog = { email: string; name: string; ok: boolean; error?: string };

const noResendLog = () => console.warn("[email] RESEND_API_KEY not set — emails disabled");

export async function notifyAdminsNewReview(reviewId: number, title: string, userName: string): Promise<EmailLog[]> {
  const logs: EmailLog[] = [];
  if (!resend) { noResendLog(); return logs; }

  try {
    const admins = await dbAll<{ email: string; name: string }>(
      "SELECT email, name FROM users WHERE role = 'admin'"
    );

    if (admins.length === 0) return logs;

    const reviewUrl = `${SITE_URL}/admin/reviews`;
    const html = emailTemplate({
      preview: "New review needs moderation",
      heading: "New Review Requires Moderation",
      body: `<p style="color:#94a3b8;margin:0 0 16px;">${escapeHtml(userName)} submitted a new review.</p>
        <div style="background:#1e293b;border-radius:8px;padding:16px;margin-bottom:16px;">
          <p style="margin:0;color:#f1f5f9;font-weight:600;">${escapeHtml(title)}</p>
        </div>`,
      cta: { url: reviewUrl, label: "Review in Admin Panel" },
    });

    for (const admin of admins) {
      try {
        const { error } = await resend.emails.send({ from: FROM, to: admin.email, subject: `New Review: ${title}`, html });
        if (error) {
          logSend("notify-admin", admin.email, false, error.message);
          logs.push({ email: admin.email, name: admin.name, ok: false, error: error.message });
        } else {
          logSend("notify-admin", admin.email, true);
          logs.push({ email: admin.email, name: admin.name, ok: true });
        }
      } catch (e) {
        logSend("notify-admin", admin.email, false, String(e));
        logs.push({ email: admin.email, name: admin.name, ok: false, error: String(e) });
      }
    }
  } catch (e) {
    console.error(`[email] notify-admins fetch error: ${e}`);
    logs.push({ email: "", name: "", ok: false, error: `Failed to fetch admins: ${e}` });
  }

  return logs;
}

export async function notifyCreatorReviewApproved(
  userEmail: string,
  userName: string,
  reviewTitle: string,
  recruiterSlug?: string | null,
  companySlug?: string | null
): Promise<EmailLog> {
  if (!resend) { noResendLog(); return { email: userEmail, name: userName, ok: false, error: "Resend not configured" }; }

  try {
    let profileUrl = `${SITE_URL}/admin/reviews`;
    if (recruiterSlug) profileUrl = `${SITE_URL}/recruiters/${recruiterSlug}`;
    else if (companySlug) profileUrl = `${SITE_URL}/companies/${companySlug}`;

    const html = emailTemplate({
      preview: "Your review has been approved and is now live",
      heading: "Your Review Is Now Live",
      body: `<p style="color:#94a3b8;margin:0 0 12px;">Hi ${escapeHtml(userName)},</p>
        <p style="color:#94a3b8;margin:0 0 12px;">Great news — your review "<strong style="color:#f1f5f9;">${escapeHtml(reviewTitle)}</strong>" has been reviewed and is now <strong style="color:#a3e635;">approved</strong> and visible on the site.</p>
        <p style="color:#94a3b8;margin:0 0 12px;">Thank you for taking the time to share your experience. Every review makes our community stronger and helps someone else avoid a bad hiring situation.</p>
        <div style="background:#1e293b;border-radius:8px;padding:16px;margin-bottom:16px;">
          <p style="margin:0 0 8px;color:#a3e635;font-weight:600;">What you can do next:</p>
          <ul style="color:#94a3b8;margin:0;padding-left:20px;">
            <li style="margin-bottom:4px;">Share the link to your review on social media to warn others</li>
            <li style="margin-bottom:4px;">If you have more evidence, add it to strengthen your review</li>
            <li style="margin-bottom:4px;">Ratify other reviews you agree with to boost their visibility</li>
          </ul>
        </div>
        <p style="color:#94a3b8;margin:0 0 4px;">Together we can expose unethical practices and make hiring fair for everyone.</p>
        <p style="color:#64748b;margin:0 0 16px;">— The Stinkout Team</p>`,
      cta: { url: profileUrl, label: "View Your Review" },
      footer: "If you have any questions, reply to this email. You received this because you submitted a review on Stinkout.",
    });

    const { error } = await resend.emails.send({ from: FROM, to: userEmail, subject: `Review Approved: ${reviewTitle}`, html });
    if (error) {
      logSend("approved-notify", userEmail, false, error.message);
      return { email: userEmail, name: userName, ok: false, error: error.message };
    }
    logSend("approved-notify", userEmail, true);
    return { email: userEmail, name: userName, ok: true };
  } catch (e) {
    logSend("approved-notify", userEmail, false, String(e));
    return { email: userEmail, name: userName, ok: false, error: String(e) };
  }
}

function buildBroadcastBody(senderName: string): string {
  return `<p style="color:#94a3b8;margin:0 0 12px;">Hi there,</p>
    <p style="color:#94a3b8;margin:0 0 12px;">Every day, countless job seekers are ghosted, misled, or mistreated by unethical recruiters and hiring practices. <strong style="color:#f1f5f9;">Stinkout</strong> exists to change that — but we can't do it alone.</p>
    <p style="color:#94a3b8;margin:0 0 12px;">You are part of this community because you believe in transparency and accountability. Now we're asking for your help to spread the word.</p>
    <div style="background:#1e293b;border-radius:8px;padding:16px;margin-bottom:16px;">
      <p style="margin:0 0 8px;color:#a3e635;font-weight:600;">How you can help:</p>
      <ul style="color:#94a3b8;margin:0;padding-left:20px;">
        <li style="margin-bottom:4px;">Share Stinkout with friends and colleagues who are job hunting</li>
        <li style="margin-bottom:4px;">Post about it on social media — LinkedIn, Twitter, Reddit, wherever hiring happens</li>
        <li style="margin-bottom:4px;">If you've had a bad experience, write a review and help someone avoid the same fate</li>
      </ul>
    </div>
    <p style="color:#94a3b8;margin:0 0 16px;">The more people who contribute, the harder it becomes for bad actors to hide.</p>
    <p style="color:#64748b;margin:0 0 4px;">With gratitude,</p>
    <p style="color:#f1f5f9;margin:0 0 16px;font-weight:600;">${escapeHtml(senderName)} &mdash; Stinkout Team</p>`;
}

export async function sendBroadcastToUser(userId: number, senderName: string): Promise<EmailLog> {
  if (!resend) { noResendLog(); return { email: "", name: "", ok: false, error: "Resend not configured" }; }

  try {
    const user = await dbGet<{ email: string; name: string }>(
      "SELECT email, name FROM users WHERE id = ? AND email IS NOT NULL AND email != ''",
      userId
    );

    if (!user) return { email: "", name: "", ok: false, error: "User not found or has no email" };

    const body = buildBroadcastBody(senderName);
    const html = emailTemplate({
      preview: "Help others avoid being ghosted — share Stinkout",
      heading: "Our mission needs you",
      body: body.replace("Hi there,", `Hi ${escapeHtml(user.name)},`),
      cta: { url: SITE_URL, label: "Visit Stinkout" },
      footer: "You received this email because you registered on Stinkout. If you'd like to stop receiving these updates, you can delete your account from your profile settings.",
    });

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: user.email,
      subject: "Help others avoid being ghosted — share Stinkout",
      html,
    });

    if (error) {
      console.error("[email] broadcast-user error:", error);
      logSend("broadcast-user", user.email, false, error.message);
      return { email: user.email, name: user.name, ok: false, error: error.message };
    }

    console.log("[email] broadcast-user response:", data?.id);
    logSend("broadcast-user", user.email, true);
    return { email: user.email, name: user.name, ok: true };
  } catch (e) {
    logSend("broadcast-user", "", false, `userId=${userId}: ${e}`);
    return { email: "", name: "", ok: false, error: String(e) };
  }
}

export async function broadcastToAllUsers(senderName: string): Promise<{ logs: EmailLog[] }> {
  const logs: EmailLog[] = [];
  if (!resend) { noResendLog(); return { logs }; }

  try {
    const users = await dbAll<{ email: string; name: string }>(
      "SELECT email, name FROM users WHERE email IS NOT NULL AND email != ''"
    );

    if (users.length === 0) { console.log("[email] broadcast-to-all: 0 recipients"); return { logs }; }
    console.log(`[email] broadcast-to-all started: ${users.length} recipients`);

    const body = buildBroadcastBody(senderName);
    const baseHtml = emailTemplate({
      preview: "Help others avoid being ghosted — share Stinkout",
      heading: "Our mission needs you",
      body,
      cta: { url: SITE_URL, label: "Visit Stinkout" },
      footer: "You received this email because you registered on Stinkout. If you'd like to stop receiving these updates, you can delete your account from your profile settings.",
    });

    const CONCURRENCY = 10;
    for (let i = 0; i < users.length; i += CONCURRENCY) {
      const batch = users.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map(async (u) => {
          try {
            const { error } = await resend!.emails.send({
              from: FROM,
              to: u.email,
              subject: "Help others avoid being ghosted — share Stinkout",
              html: baseHtml.replace("Hi there,", `Hi ${escapeHtml(u.name)},`),
            });
            if (error) {
              logSend("broadcast-all", u.email, false, error.message);
              return { email: u.email, name: u.name, ok: false, error: error.message } as EmailLog;
            }
            logSend("broadcast-all", u.email, true);
            return { email: u.email, name: u.name, ok: true } as EmailLog;
          } catch (e) {
            logSend("broadcast-all", u.email, false, String(e));
            return { email: u.email, name: u.name, ok: false, error: String(e) } as EmailLog;
          }
        })
      );
      for (const r of results) {
        if (r.status === "fulfilled") logs.push(r.value);
        else logs.push({ email: "unknown", name: "unknown", ok: false, error: r.reason?.toString() || "Unknown" });
      }
    }
  } catch (e) {
    logs.push({ email: "", name: "", ok: false, error: `Failed to fetch users: ${e}` });
  }

  return { logs };
}

function logSend(label: string, email: string, ok: boolean, error?: string) {
  if (ok) {
    console.log(`[email] ${label} → ${email} ✓`);
  } else {
    console.error(`[email] ${label} → ${email} ✗ ${error || ""}`);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function emailTemplate(opts: {
  preview: string;
  heading: string;
  body: string;
  cta?: { url: string; label: string };
  footer?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light">
<style>@media(prefers-color-scheme:light){.wrapper{background:#f8fafc!important}.card{background:#fff!important;border-color:#e2e8f0!important}.heading{color:#0f172a!important}.text{color:#475569!important}.accent{color:#65a30d!important}.muted{color:#94a3b8!important}}</style>
</head>
<body style="margin:0;padding:0;background-color:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div class="wrapper" style="background-color:#020617;padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
<tr><td style="padding-bottom:16px;">
<div style="font-size:22px;font-weight:bold;">☣ <span style="color:#a3e635;">Stinkout</span></div>
</td></tr>
<tr><td>
<div class="card" style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:32px 24px;">
<h1 class="heading" style="margin:0 0 16px;font-size:22px;color:#f1f5f9;line-height:1.3;">${opts.heading}</h1>
<div class="text" style="color:#94a3b8;font-size:15px;line-height:1.6;">${opts.body}</div>
${opts.cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;"><tr><td style="background:#65a30d;border-radius:8px;padding:12px 24px;text-align:center;"><a href="${opts.cta.url}" style="color:#fff;text-decoration:none;font-size:14px;font-weight:600;display:inline-block;">${opts.cta.label}</a></td></tr></table>` : ""}
${opts.footer ? `<p class="muted" style="color:#64748b;font-size:12px;margin-top:24px;line-height:1.5;">${opts.footer}</p>` : ""}
</div>
</td></tr>
<tr><td style="padding-top:16px;text-align:center;">
<p style="color:#475569;font-size:11px;margin:0;">&copy; ${new Date().getFullYear()} Stinkout &mdash; Expose Unethical Recruiters</p>
</td></tr>
</table>
</div>
</body>
</html>`;
}
