export interface OutreachEmailInput {
  businessName:   string;
  ownerName?:     string;
  trade?:         string;
  location?:      string;
  previewUrl?:    string;
  formUrl:        string;
  unsubscribeUrl: string;
}

// Brand palette from RidenLogo.png
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
  const greeting   = p.ownerName ? `Hi ${p.ownerName},` : "Hi there,";
  const bizRef     = p.businessName;
  const tradeRef   = p.trade    ? `${p.trade} ` : "";
  const locRef     = p.location ? ` in ${p.location}` : "";
  const tradeNear  = p.trade    ? `"${p.trade} near me"` : `"trades near me"`;
  const tradeLoc   = p.trade && p.location ? `"${p.trade} in ${p.location}"` : "";
  const hasPreview = !!(p.previewUrl?.trim());

  const subject = hasPreview
    ? `I built a website for ${bizRef} — take a look (no obligation)`
    : `Could we help ${bizRef} get more local customers?`;

  const heroTagline = hasPreview
    ? "Your website is ready to view"
    : "A message from Riden Technologies";

  const heroTitle = hasPreview
    ? `We built a website for <em style="font-style:normal;color:${CYAN};">${bizRef}</em>`
    : `Could we help <em style="font-style:normal;color:${CYAN};">${bizRef}</em> get more customers?`;

  // ── Build the "intro + CTA" block depending on whether we have a preview ──
  let leadIn = "";
  if (hasPreview) {
    leadIn =
      `<p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.75;color:${TEXT_BODY};">` +
        `So rather than just firing over a generic pitch, I went ahead and put together a website concept specifically for ${bizRef}. It&rsquo;s live right now &mdash; you can view it here:` +
      `</p>` +

      // Preview button
      `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">` +
        `<tr><td style="background:linear-gradient(135deg,${CYAN} 0%,${BLUE} 100%);border-radius:8px;box-shadow:0 4px 14px rgba(34,211,238,0.3);">` +
          `<a href="${p.previewUrl}" style="display:inline-block;padding:16px 36px;color:${WHITE};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;white-space:nowrap;">` +
            `View your website preview &rarr;` +
          `</a>` +
        `</td></tr>` +
      `</table>` +

      `<p style="margin:0 0 16px;font-size:12px;color:${TEXT_MUTED};font-family:Arial,Helvetica,sans-serif;">` +
        `Or paste into your browser: <a href="${p.previewUrl}" style="color:${CYAN_DARK};word-break:break-all;">${p.previewUrl}</a>` +
      `</p>` +

      `<p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.75;color:${TEXT_BODY};">` +
        `<strong style="color:${TEXT_DARK};">Absolutely no obligation</strong> &mdash; if it&rsquo;s not for you, no hard feelings at all.` +
      `</p>` +

      `<p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.75;color:${TEXT_BODY};">` +
        `If you do like it, getting it live on your own domain is straightforward and we can have it up quickly. We handle absolutely everything from there:` +
      `</p>`;
  } else {
    leadIn =
      `<p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.75;color:${TEXT_BODY};">` +
        `We specialise in building websites for ${tradeRef}businesses, and I&rsquo;d love to put something together specifically for ${bizRef} &mdash; completely free to view, no obligation whatsoever.` +
      `</p>` +

      `<p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.75;color:${TEXT_BODY};">` +
        `If you&rsquo;re open to it, we handle absolutely everything from day one:` +
      `</p>`;
  }

  // ── Included items checklist ──
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

  // ── Full HTML ──
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

    // ── Wrapper ──
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${WHITE};border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.12);">` +

      // HEADER — dark navy, text-based logo (PNG has white bg, text renders everywhere)
      `<tr><td style="background:${NAVY};padding:20px 40px;">` +
        `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>` +
          `<td style="vertical-align:middle;">` +
            // "R" mark — cyan square with bold R
            `<span style="display:inline-block;background:${CYAN};border-radius:6px;width:32px;height:32px;text-align:center;line-height:32px;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:900;color:${NAVY};vertical-align:middle;margin-right:10px;">R</span>` +
            `<span style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:${WHITE};vertical-align:middle;letter-spacing:-0.3px;">Riden</span>` +
            `<span style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:400;color:${TEXT_LIGHT};vertical-align:middle;letter-spacing:1.5px;text-transform:uppercase;margin-left:6px;">Technologies</span>` +
          `</td>` +
          `<td align="right" style="vertical-align:middle;"><span style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:${TEXT_LIGHT};letter-spacing:1.4px;text-transform:uppercase;">Web Development</span></td>` +
        `</tr></table>` +
      `</td></tr>` +

      // Cyan accent bar
      `<tr><td style="background:linear-gradient(90deg,${CYAN} 0%,${BLUE} 100%);height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>` +

      // HERO BAND — dark navy gradient
      `<tr><td style="background:linear-gradient(135deg,${NAVY_MID} 0%,#1a3a5c 100%);padding:32px 40px 28px;">` +
        `<p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${CYAN};">${heroTagline}</p>` +
        `<h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:${WHITE};line-height:1.35;">${heroTitle}</h1>` +
      `</td></tr>` +

      // BODY
      `<tr><td style="padding:36px 40px 24px;">` +
        `<p style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.75;color:${TEXT_BODY};">${greeting}</p>` +
        `<p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.75;color:${TEXT_BODY};">` +
          `Hope you don&rsquo;t mind me reaching out &mdash; my name&rsquo;s Ridley, I run a small web development company called Riden Technologies based in the UK.` +
        `</p>` +
        `<p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.75;color:${TEXT_BODY};">` +
          `I came across <strong style="color:${TEXT_DARK};">${bizRef}</strong>${locRef} recently and had a look at your online presence. You clearly do great work, but I genuinely felt your website wasn&rsquo;t doing you justice &mdash; and for a ${tradeRef}business${locRef}, that can easily mean missing out on a steady flow of local enquiries every month.` +
        `</p>` +
        leadIn +
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
          // pricing header bar
          `<tr><td style="background:linear-gradient(90deg,${CYAN} 0%,${BLUE} 100%);padding:11px 24px;">` +
            `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${WHITE};">Simple, transparent pricing</p>` +
          `</td></tr>` +
          // setup fee
          `<tr><td style="padding:22px 24px 12px;">` +
            `<span style="font-family:Arial,Helvetica,sans-serif;font-size:38px;font-weight:700;color:${WHITE};line-height:1;">&#163;299</span>` +
            `<span style="display:block;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${TEXT_LIGHT};margin-top:3px;">one-off setup fee &mdash; site built &amp; live on your own domain</span>` +
          `</td></tr>` +
          // divider
          `<tr><td style="padding:0 24px;"><div style="height:1px;background:rgba(255,255,255,0.08);font-size:0;">&nbsp;</div></td></tr>` +
          // monthly
          `<tr><td style="padding:12px 24px 20px;">` +
            `<span style="font-family:Arial,Helvetica,sans-serif;font-size:38px;font-weight:700;color:${CYAN};line-height:1;">&#163;50</span>` +
            `<span style="display:block;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${TEXT_LIGHT};margin-top:3px;">per month &mdash; hosting, support, updates &amp; everything ongoing</span>` +
          `</td></tr>` +
          // guarantee
          `<tr><td style="background:rgba(34,211,238,0.08);padding:14px 24px;border-top:1px solid rgba(34,211,238,0.15);">` +
            `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${CYAN};line-height:1.5;">` +
              `&#10003;&nbsp; <strong>14-day money-back guarantee</strong> &mdash; not happy within the first two weeks? Full refund of the setup fee. No questions asked.` +
            `</p>` +
          `</td></tr>` +
        `</table>` +
      `</td></tr>` +

      // INTEREST CTA
      `<tr><td style="padding:0 40px 32px;">` +
        `<p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.75;color:${TEXT_BODY};">` +
          `If you&rsquo;d like to go ahead, or just want a quick 15-minute call to talk through design changes, features, or any questions &mdash; fill in this short form. Takes under two minutes:` +
        `</p>` +
        `<table role="presentation" cellpadding="0" cellspacing="0">` +
          `<tr><td style="background:${NAVY};border:2px solid ${CYAN};border-radius:8px;">` +
            `<a href="${p.formUrl}" style="display:inline-block;padding:16px 36px;color:${WHITE};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;text-decoration:none;white-space:nowrap;">` +
              `Yes, I&rsquo;m interested &mdash; let&rsquo;s talk &rarr;` +
            `</a>` +
          `</td></tr>` +
        `</table>` +
      `</td></tr>` +

      // SIGN-OFF
      `<tr><td style="padding:24px 40px 32px;border-top:1px solid ${BORDER};">` +
        `<p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.75;color:${TEXT_BODY};">` +
          `Feel free to reply directly to this email if you&rsquo;d rather just chat &mdash; I&rsquo;m always happy to answer any questions.` +
        `</p>` +
        `<p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.75;color:${TEXT_BODY};">` +
          `Thanks so much for your time &mdash; hope to hear from you.` +
        `</p>` +
        // Signature
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

    `</table>` + // /wrapper
    `</td></tr></table>` + // /outer
    `</body></html>`;

  return { subject, html };
}
