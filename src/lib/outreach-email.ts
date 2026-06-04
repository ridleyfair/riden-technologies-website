export interface OutreachEmailInput {
  businessName: string;
  ownerName?:   string;
  trade?:       string;
  location?:    string;
  previewUrl:   string;
  formUrl:      string;
  unsubscribeUrl: string;
}

export function buildOutreachEmailHtml(p: OutreachEmailInput): { subject: string; html: string } {
  const greeting   = p.ownerName ? `Hi ${p.ownerName},` : "Hi there,";
  const bizRef     = p.businessName;
  const tradeRef   = p.trade   ? `${p.trade} ` : "";
  const locRef     = p.location ? ` in ${p.location}` : "";
  const tradeNear  = p.trade   ? `"${p.trade} near me"` : `"${bizRef} near me"`;
  const tradeLoc   = p.trade && p.location ? `"${p.trade} in ${p.location}"` : "";

  const subject = `I put a website together for ${bizRef} — take a look (no obligation)`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr>
        <td style="background:#0f1117;padding:20px 32px;text-align:left;">
          <span style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:700;letter-spacing:-0.3px;">Riden Technologies</span>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:36px 32px 28px;color:#1a1a1a;font-size:16px;line-height:1.7;">

          <p style="margin:0 0 20px;">${greeting}</p>

          <p style="margin:0 0 16px;">Hope you don't mind me reaching out — my name's Ridley, I run a small web development company called Riden Technologies based in the UK.</p>

          <p style="margin:0 0 16px;">I came across <strong>${bizRef}</strong>${locRef} recently and had a look at your online presence. You clearly do great work, but I genuinely felt your website wasn't doing you justice — and for a ${tradeRef}business${locRef}, that can easily mean missing out on a steady flow of local enquiries every month.</p>

          <p style="margin:0 0 20px;">So rather than just sending over a generic pitch, I went ahead and put together a website concept specifically for ${bizRef}. It's live right now and you can view it here:</p>

          <!-- Preview CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr>
              <td style="background:#1a56db;border-radius:6px;">
                <a href="${p.previewUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">View the website preview →</a>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 16px;color:#555;font-size:13px;">(Or copy this link: <a href="${p.previewUrl}" style="color:#1a56db;">${p.previewUrl}</a>)</p>

          <p style="margin:0 0 16px;"><strong>Absolutely no obligation</strong> — if it's not for you, no hard feelings at all.</p>

          <p style="margin:0 0 16px;">If you do like it, getting it live on your own domain is quick and straightforward. We handle everything from there — hosting, updates, content changes, new photos, technical maintenance, and ongoing support. You won't need to touch a thing.</p>

          <p style="margin:0 0 16px;">The site is also built with local SEO in mind, so it's set up to appear when people search for things like <em>${tradeNear}</em>${tradeLoc ? `, <em>${tradeLoc}</em>,` : ""} and similar local searches. Fully mobile-friendly and professionally developed throughout.</p>

          <!-- Pricing -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;background:#f8f9fc;border-radius:8px;border:1px solid #e8eaf0;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#888;">Simple, transparent pricing</p>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:4px 0;">
                      <span style="font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#1a1a1a;">£299</span>
                      <span style="font-family:Arial,sans-serif;font-size:14px;color:#555;margin-left:6px;">one-off setup fee</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;">
                      <span style="font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#1a1a1a;">£50</span>
                      <span style="font-family:Arial,sans-serif;font-size:14px;color:#555;margin-left:6px;">per month (hosting, support, updates, everything)</span>
                    </td>
                  </tr>
                </table>
                <p style="margin:14px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#555;">✓ <strong>14-day money-back guarantee</strong> — if you're not happy within the first two weeks, we'll refund the setup fee in full. No questions asked.</p>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 16px;">If you'd like to go ahead, or even just have a quick 15-minute call to talk through design changes, features, or any questions — you can let us know through this short form. It takes under two minutes:</p>

          <!-- Interest form CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr>
              <td style="background:#0f1117;border-radius:6px;">
                <a href="${p.formUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:600;text-decoration:none;">Yes, I'm interested — tell me more →</a>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 16px;">Feel free to reply directly to this email if you'd rather just chat — I'm always happy to answer any questions.</p>

          <p style="margin:0 0 32px;">Thanks so much for your time — hope to hear from you.</p>

          <p style="margin:0;font-family:Arial,sans-serif;">Ridley<br>
          <strong>Riden Technologies</strong><br>
          <a href="https://ridentechnologies.com" style="color:#1a56db;">ridentechnologies.com</a></p>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8f9fc;border-top:1px solid #e8eaf0;padding:16px 32px;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#aaa;line-height:1.6;">
            You're receiving this because we came across ${bizRef} and felt we could help with your online presence.<br>
            If you'd prefer not to hear from us again, <a href="${p.unsubscribeUrl}" style="color:#aaa;">click here to unsubscribe</a>.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  return { subject, html };
}
