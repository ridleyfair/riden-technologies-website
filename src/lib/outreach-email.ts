import { type PricingTier, getTier } from "@/lib/pricing";

export interface OutreachEmailInput {
  businessName:   string;
  ownerName?:     string;
  trade?:         string;
  location?:      string;
  formUrl:        string;
  unsubscribeUrl: string;
  pricingTier?:   PricingTier;
}

// Brand palette
const NAVY       = "#0d1b2a";
const NAVY_MID   = "#122236";
const CYAN       = "#22d3ee";
const CYAN_DARK  = "#0891b2";
const BLUE       = "#1d4ed8";
const WHITE      = "#ffffff";
const BODY_BG    = "#f1f5f9";
const TEXT_DARK  = "#0f172a";
const TEXT_BODY  = "#334155";
const TEXT_MUTED = "#64748b";
const TEXT_LIGHT = "#94a3b8";
const BORDER     = "#e2e8f0";

function checkRow(text: string): string {
  return (
    `<tr>` +
    `<td style="padding:4px 0;vertical-align:top;">` +
    `<span style="color:${CYAN};font-size:15px;font-weight:700;padding-right:10px;font-family:Arial,Helvetica,sans-serif;">&#10003;</span>` +
    `</td>` +
    `<td style="padding:4px 0;">` +
    `<span style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${TEXT_BODY};line-height:1.6;">${text}</span>` +
    `</td>` +
    `</tr>`
  );
}

export function buildOutreachEmailHtml(p: OutreachEmailInput): { subject: string; html: string } {
  const greeting  = p.ownerName ? `Hi ${p.ownerName},` : "Hi there,";
  const bizRef    = p.businessName;
  const tradeRef  = p.trade    ? `${p.trade} ` : "";
  const locRef    = p.location ? ` in ${p.location}` : "";
  const tradeNear = p.trade    ? `"${p.trade} near me"` : `"trades near me"`;
  const tradeLoc  = p.trade && p.location ? `"${p.trade} in ${p.location}"` : "";
  const tier      = getTier(p.pricingTier ?? "pro");
  const setupFee  = `£${tier.setupFee}`;
  const monthly   = `£${tier.monthlyFee}`;

  const subject = `We've built a website for your business, ${bizRef} — want to take a look?`;

  const seoBullet = `Local SEO so you appear for <em>${tradeNear}</em>` +
    (tradeLoc ? ` and <em>${tradeLoc}</em>` : "");

  const checklistRows = [
    "Hosting &amp; domain management",
    "Content updates whenever you need them",
    "New photos added as you go",
    "Technical maintenance &amp; security",
    "Ongoing support &mdash; just email or call",
    seoBullet,
    "Fully mobile-friendly &amp; professionally developed",
  ].map(checkRow).join("");

  const html =
    `<!DOCTYPE html>` +
    `<html lang="en" xmlns="http://www.w3.org/1999/xhtml">` +
    `<head>` +
      `<meta charset="UTF-8">` +
      `<meta name="viewport" content="width=device-width,initial-scale=1.0">` +
      `<title>${subject}</title>` +
    `</head>` +
    `<body style="margin:0;padding:0;background-color:${BODY_BG};-webkit-text-size-adjust:100%;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BODY_BG};padding:32px 16px;">` +
    `<tr><td align="center">` +

    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${WHITE};border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.12);">` +

      // HEADER
      `<tr><td style="background:#ffffff;padding:20px 40px;border-bottom:1px solid #e8edf2;">` +
        `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>` +
          `<td style="vertical-align:middle;">` +
            `<img src="https://ridentechnologies.com/images/RidenLogo-email.png"` +
              ` alt="Riden Technologies" width="180"` +
              ` style="display:block;border:0;max-width:180px;height:auto;" />` +
          `</td>` +
          `<td align="right" style="vertical-align:middle;">` +
            `<span style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:${TEXT_MUTED};letter-spacing:1.4px;text-transform:uppercase;">Web Development</span>` +
          `</td>` +
        `</tr></table>` +
      `</td></tr>` +

      // Accent bar
      `<tr><td style="background:linear-gradient(90deg,${CYAN} 0%,${BLUE} 100%);height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>` +

      // HERO
      `<tr><td style="background:linear-gradient(135deg,${NAVY_MID} 0%,#1a3a5c 100%);padding:32px 40px 28px;">` +
        `<p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${CYAN};">From Riden Technologies</p>` +
        `<h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:${WHITE};line-height:1.35;">` +
          `We&rsquo;ve already built a website for your business, <em style="font-style:normal;color:${CYAN};">${bizRef}</em>` +
        `</h1>` +
      `</td></tr>` +

      // BODY
      `<tr><td style="padding:36px 40px 24px;">` +
        `<p style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.75;color:${TEXT_BODY};">${greeting}</p>` +

        `<p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.75;color:${TEXT_BODY};">` +
          `My name&rsquo;s Ridley &mdash; I run Riden Technologies, a small web development company based in the UK. ` +
          `We build websites for ${tradeRef}businesses and we&rsquo;ve already put one together for <strong style="color:${TEXT_DARK};">${bizRef}</strong>.` +
        `</p>` +

        `<p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.75;color:${TEXT_BODY};">` +
          `<strong style="color:${TEXT_DARK};">Would you like me to send you the link to take a look?</strong> ` +
          `It&rsquo;s completely free to view &mdash; no commitment, no obligation. ` +
          `Just reply to this email and I&rsquo;ll send it straight over.` +
        `</p>` +

        `<p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.75;color:${TEXT_BODY};">` +
          `If you like it and want to get it live, it&rsquo;s ${setupFee} to launch on your own domain, then just ${monthly}&nbsp;a&nbsp;month &mdash; everything handled for you:` +
        `</p>` +
      `</td></tr>` +

      // CHECKLIST
      `<tr><td style="padding:0 40px 28px;">` +
        `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f0f9ff;border:1px solid #bae6fd;border-left:4px solid ${CYAN};border-radius:0 8px 8px 0;">` +
          `<tr><td style="padding:18px 22px;">` +
            `<table role="presentation" cellpadding="0" cellspacing="0">${checklistRows}</table>` +
          `</td></tr>` +
        `</table>` +
      `</td></tr>` +

      // PRICING
      `<tr><td style="padding:0 40px 28px;">` +
        `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${NAVY};border-radius:10px;overflow:hidden;">` +
          `<tr><td style="background:linear-gradient(90deg,${CYAN} 0%,${BLUE} 100%);padding:11px 24px;">` +
            `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${WHITE};">Simple, transparent pricing</p>` +
          `</td></tr>` +
          `<tr><td style="padding:22px 24px 12px;">` +
            `<span style="font-family:Arial,Helvetica,sans-serif;font-size:38px;font-weight:700;color:${WHITE};line-height:1;">${setupFee}</span>` +
            `<span style="display:block;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${TEXT_LIGHT};margin-top:3px;">one-off setup fee &mdash; site built &amp; live on your own domain</span>` +
          `</td></tr>` +
          `<tr><td style="padding:0 24px;"><div style="height:1px;background:rgba(255,255,255,0.08);font-size:0;">&nbsp;</div></td></tr>` +
          `<tr><td style="padding:12px 24px 20px;">` +
            `<span style="font-family:Arial,Helvetica,sans-serif;font-size:38px;font-weight:700;color:${CYAN};line-height:1;">${monthly}</span>` +
            `<span style="display:block;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${TEXT_LIGHT};margin-top:3px;">per month &mdash; hosting, support, updates &amp; everything ongoing</span>` +
          `</td></tr>` +
          `<tr><td style="background:rgba(34,211,238,0.08);padding:14px 24px;border-top:1px solid rgba(34,211,238,0.15);">` +
            `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${CYAN};line-height:1.5;">` +
              `&#10003;&nbsp; <strong>14-day money-back guarantee</strong> &mdash; not happy within the first two weeks? Full refund of the setup fee. No questions asked.` +
            `</p>` +
          `</td></tr>` +
        `</table>` +
      `</td></tr>` +

      // REPLY NUDGE
      `<tr><td style="padding:0 40px 32px;">` +
        `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid ${BORDER};border-radius:8px;">` +
          `<tr><td style="padding:18px 22px;">` +
            `<p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:${TEXT_DARK};">To see your website, just reply to this email.</p>` +
            `<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.65;color:${TEXT_BODY};">` +
              `I&rsquo;ll send the link straight over. Happy to jump on a quick call too if you&rsquo;d prefer &mdash; just say the word.` +
            `</p>` +
          `</td></tr>` +
        `</table>` +
      `</td></tr>` +

      // SIGN-OFF
      `<tr><td style="padding:24px 40px 32px;border-top:1px solid ${BORDER};">` +
        `<p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.75;color:${TEXT_BODY};">` +
          `Thanks so much for your time &mdash; I hope to hear from you.` +
        `</p>` +
        `<table role="presentation" cellpadding="0" cellspacing="0">` +
          `<tr><td style="border-left:3px solid ${CYAN};padding-left:14px;">` +
            `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:${TEXT_DARK};">Ridley</p>` +
            `<p style="margin:2px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${TEXT_MUTED};">Founder, Riden Technologies</p>` +
            `<p style="margin:2px 0 0;"><a href="https://ridentechnologies.com" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${CYAN_DARK};text-decoration:none;">ridentechnologies.com</a></p>` +
          `</td></tr>` +
        `</table>` +
      `</td></tr>` +

      // FOOTER
      `<tr><td style="background:${NAVY};padding:20px 40px;border-radius:0 0 12px 12px;">` +
        `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${TEXT_LIGHT};line-height:1.7;text-align:center;">` +
          `You&rsquo;re receiving this because we came across <strong style="color:${WHITE};">${bizRef}</strong> and thought we could help.` +
          `<br><a href="${p.unsubscribeUrl}" style="color:${TEXT_MUTED};text-decoration:underline;">Unsubscribe</a>` +
          `&nbsp;&middot;&nbsp;<a href="https://ridentechnologies.com" style="color:${TEXT_MUTED};text-decoration:underline;">ridentechnologies.com</a>` +
        `</p>` +
      `</td></tr>` +

    `</table>` +
    `</td></tr></table>` +
    `</body></html>`;

  return { subject, html };
}
