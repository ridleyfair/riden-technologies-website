import { type PricingTier, getTier } from "@/lib/pricing";

export interface OutreachEmailParams {
  businessName: string;
  contactEmail?: string;
  previewUrl?: string;
  industry?: string;
  location?: string;
  pricingTier?: PricingTier;
}

export interface OutreachEmail {
  recipient: string;
  subject: string;
  body: string;
  mailtoUrl: string;
  outlookUrl: string;
}

// Encode for mailto: use %0D%0A for line breaks (works in Outlook + default clients)
function encodeMailtoBody(text: string): string {
  return encodeURIComponent(text).replace(/%0A/g, "%0D%0A");
}

export function buildWebsitePreviewEmail(params: OutreachEmailParams): OutreachEmail {
  const {
    businessName,
    contactEmail = "",
    previewUrl,
    location,
    pricingTier,
  } = params;
  const tier = getTier(pricingTier ?? "pro");
  const setupFee = `£${tier.setupFee}`;
  const monthly = `£${tier.monthlyFee}`;

  const subject = previewUrl
    ? `Your website preview — ${businessName}`
    : `I've built a website for ${businessName}`;

  const body = previewUrl
    ? `Hi there,

Hope you're well.

I came across ${businessName}${location ? ` in ${location}` : ""} and noticed you had a strong local presence, so I put together a quick website preview to show how your business could look online.

You can view it here:
${previewUrl}

I run Riden Technologies. We build modern websites for small businesses, especially trade and service companies that want more enquiries and a cleaner online presence.

This is just a preview — nothing is live or public yet. I thought it might be useful to see what your business could look like with a proper website built around your services, reviews, and photos.

If you like what you see, I'd be happy to make any changes and talk through getting it live for you. It's ${setupFee} to set up and ${monthly} ongoing — no pressure at all.

Kind regards,
Ridley
Riden Technologies`
    : `Hi there,

I've already put together a website for your business, ${businessName} — would you like me to send you the link to take a look?

No commitment, completely free to view. If you like it, we can talk about getting it live. It's ${setupFee} to set up and just ${monthly} ongoing — everything handled for you.

Just reply and I'll send it over.

Kind regards,
Ridley
Riden Technologies`;

  const encodedSubject = encodeURIComponent(subject);
  const encodedBody    = encodeMailtoBody(body);

  const mailtoUrl = `mailto:${contactEmail}?subject=${encodedSubject}&body=${encodedBody}`;

  const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(contactEmail)}&subject=${encodedSubject}&body=${encodedBody}`;

  return { recipient: contactEmail, subject, body, mailtoUrl, outlookUrl };
}

// Read the user's preferred email client from localStorage
export function getEmailClientPref(): "default" | "outlook_web" {
  if (typeof window === "undefined") return "default";
  return (localStorage.getItem("email_client") as "default" | "outlook_web") ?? "default";
}

// Open the compose window using the correct client
export function openEmailCompose(email: OutreachEmail): void {
  const pref = getEmailClientPref();
  if (pref === "outlook_web") {
    window.open(email.outlookUrl, "_blank", "noopener,noreferrer");
  } else {
    window.location.href = email.mailtoUrl;
  }
}
