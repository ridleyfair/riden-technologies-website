/**
 * SendGrid email helper — pure fetch, Cloudflare Workers compatible.
 * No npm package required — uses the SendGrid Web API v3 directly.
 *
 * Required env vars (set in Cloudflare dashboard → Workers & Pages → Settings → Variables):
 *   SENDGRID_API_KEY       — starts with "SG."
 *   SENDGRID_FROM_EMAIL    — verified sender address (e.g. hello@ridentechnologies.com)
 *   SENDGRID_FROM_NAME     — optional display name (default: "Riden Technologies")
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";

function getSgConfig() {
  let env: Record<string, string | undefined> = process.env as Record<string, string | undefined>;
  try {
    const cf = getCloudflareContext().env as unknown as Record<string, string | undefined>;
    if (cf.SENDGRID_API_KEY) env = { ...env, ...cf };
  } catch {
    // local dev — fall through to process.env
  }
  return {
    apiKey: env.SENDGRID_API_KEY ?? "",
    fromEmail: env.SENDGRID_FROM_EMAIL ?? "bookings@ridentechnologies.com",
    fromName: env.SENDGRID_FROM_NAME ?? "Riden Technologies",
  };
}

export function isSendGridConfigured(): boolean {
  return !!getSgConfig().apiKey;
}

export type BookingEmailInput = {
  to: string;
  toName: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  meetingType: string;
  teamsJoinUrl?: string | null;
  notes?: string | null;
  timezone?: string;
  responseToken?: string | null;
};

function fmtDateLong(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function fmtTime(time: string): string {
  try {
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "pm" : "am";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
  } catch {
    return time;
  }
}

function buildHtml(input: BookingEmailInput): string {
  const dateFormatted = fmtDateLong(input.date);
  const timeFormatted = fmtTime(input.time);
  const tz = input.timezone ?? "Europe/London";
  const meetingTypeLabel =
    input.meetingType === "video" ? "Microsoft Teams Video Call" :
    input.meetingType === "call" ? "Phone Call" : "In-Person Meeting";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${input.title}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:32px 32px 28px;">
            <p style="margin:0 0 6px;font-size:11px;color:#93c5fd;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">Meeting Confirmation</p>
            <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">${input.title}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px 0;">
            <p style="margin:0 0 24px;font-size:15px;color:#cbd5e1;line-height:1.6;">
              Hi ${input.toName},<br/><br/>
              Your meeting with Riden Technologies has been confirmed. Please find the details below.
            </p>

            <!-- Details card -->
            <table width="100%" style="background:#0f172a;border-radius:12px;border:1px solid #334155;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:8px 0;border-bottom:1px solid #1e293b;">
                    <p style="margin:0 0 2px;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Date</p>
                    <p style="margin:0;font-size:14px;color:#f1f5f9;font-weight:600;">${dateFormatted}</p>
                  </td></tr>
                  <tr><td style="padding:8px 0;border-bottom:1px solid #1e293b;">
                    <p style="margin:0 0 2px;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Time</p>
                    <p style="margin:0;font-size:14px;color:#f1f5f9;font-weight:600;">${timeFormatted} (${tz})</p>
                  </td></tr>
                  <tr><td style="padding:8px 0;border-bottom:1px solid #1e293b;">
                    <p style="margin:0 0 2px;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Duration</p>
                    <p style="margin:0;font-size:14px;color:#f1f5f9;font-weight:600;">${input.duration}</p>
                  </td></tr>
                  <tr><td style="padding:8px 0${input.teamsJoinUrl ? ";border-bottom:1px solid #1e293b;" : ""}">
                    <p style="margin:0 0 2px;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Format</p>
                    <p style="margin:0;font-size:14px;color:#f1f5f9;font-weight:600;">${meetingTypeLabel}</p>
                  </td></tr>
                  ${input.teamsJoinUrl ? `
                  <tr><td style="padding:8px 0;">
                    <p style="margin:0 0 2px;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Join Link</p>
                    <a href="${input.teamsJoinUrl}" style="font-size:12px;color:#60a5fa;word-break:break-all;">${input.teamsJoinUrl}</a>
                  </td></tr>` : ""}
                </table>
              </td></tr>
            </table>

            ${input.teamsJoinUrl ? `
            <!-- CTA button -->
            <table width="100%" style="margin-bottom:24px;"><tr><td align="center">
              <a href="${input.teamsJoinUrl}"
                 style="display:inline-block;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.01em;">
                Join Microsoft Teams Meeting
              </a>
            </td></tr></table>` : ""}

            ${input.responseToken ? `
            <!-- Accept / Decline -->
            <table width="100%" style="margin-bottom:24px;"><tr><td>
              <p style="margin:0 0 12px;font-size:13px;color:#94a3b8;text-align:center;">Please confirm your attendance:</p>
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td width="50%" style="padding-right:6px;" align="right">
                  <a href="https://portal.ridentechnologies.com/invite-response?token=${input.responseToken}&action=accept"
                     style="display:inline-block;background:#16a34a;color:#ffffff;font-size:13px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none;">
                    ✓ Accept
                  </a>
                </td>
                <td width="50%" style="padding-left:6px;" align="left">
                  <a href="https://portal.ridentechnologies.com/invite-response?token=${input.responseToken}&action=decline"
                     style="display:inline-block;background:#475569;color:#ffffff;font-size:13px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none;">
                    ✗ Decline
                  </a>
                </td>
              </tr></table>
            </td></tr></table>` : ""}

            ${input.notes ? `
            <table width="100%" style="margin-bottom:24px;"><tr>
              <td style="background:#1e293b;border-left:3px solid #3b82f6;border-radius:4px;padding:12px 16px;">
                <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">${input.notes}</p>
              </td>
            </tr></table>` : ""}
          </td>
        </tr>

        <!-- Contact line -->
        <tr>
          <td style="padding:0 32px 28px;">
            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
              Need to reschedule or have questions? Reply to this email or reach us at
              <a href="mailto:bookings@ridentechnologies.com" style="color:#60a5fa;">bookings@ridentechnologies.com</a>.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #334155;text-align:center;">
            <p style="margin:0;font-size:11px;color:#475569;">
              Riden Technologies &middot;
              <a href="https://www.ridentechnologies.com" style="color:#475569;text-decoration:none;">www.ridentechnologies.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildPlainText(input: BookingEmailInput): string {
  const dateFormatted = fmtDateLong(input.date);
  const timeFormatted = fmtTime(input.time);
  const tz = input.timezone ?? "Europe/London";

  return [
    `Hi ${input.toName},`,
    "",
    "Your meeting with Riden Technologies has been confirmed.",
    "",
    `Title:    ${input.title}`,
    `Date:     ${dateFormatted}`,
    `Time:     ${timeFormatted} (${tz})`,
    `Duration: ${input.duration}`,
    input.teamsJoinUrl ? `Join:     ${input.teamsJoinUrl}` : null,
    input.notes ? `\nNotes: ${input.notes}` : null,
    "",
    "Need to reschedule? Reply to this email.",
    "",
    "Kind regards,",
    "Riden Technologies",
    "www.ridentechnologies.com",
  ].filter((l) => l !== null).join("\n");
}

export async function sendBookingConfirmation(input: BookingEmailInput): Promise<void> {
  const { apiKey, fromEmail, fromName } = getSgConfig();
  if (!apiKey) throw new Error("SENDGRID_API_KEY is not configured.");

  const subject = `${input.title} — ${fmtDateLong(input.date)} at ${fmtTime(input.time)}`;

  const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: input.to, name: input.toName }] }],
      from: { email: fromEmail, name: fromName },
      reply_to: { email: fromEmail, name: fromName },
      subject,
      content: [
        { type: "text/plain", value: buildPlainText(input) },
        { type: "text/html",  value: buildHtml(input) },
      ],
    }),
  });

  // SendGrid returns 202 Accepted on success
  if (!resp.ok && resp.status !== 202) {
    const body = await resp.text();
    throw new Error(`SendGrid error (${resp.status}): ${body}`);
  }
}
