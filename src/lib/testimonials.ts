export interface Testimonial {
  /** Client's words. */
  quote: string;
  /** Business name shown as the reviewer. */
  name: string;
  /** Location / trade descriptor. */
  business: string;
  /** 1–5. */
  rating: number;
  /** Two-letter initials for the avatar fallback. */
  initials: string;
  accent: "blue" | "violet" | "cyan" | "emerald" | "amber";
  /** Path to business logo — falls back to initials avatar if absent. */
  avatar?: string;
  /** When true, the card is rendered as a non-attributed sample. */
  isPlaceholder?: boolean;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Been meaning to sort a proper website for years but kept putting it off. Riden got it done in no time and it looks brilliant. Had three new customers this month tell me they found me on Google. Worth every penny.",
    name: "Collins Plumbing & Heating",
    business: "Plumbing & Heating · Leeds",
    rating: 5,
    initials: "CP",
    accent: "blue",
    avatar: "/images/testimonials/collins-plumbing-logo.png",
  },
  {
    quote:
      "Didn't expect much if I'm honest — thought it'd be another dodgy website company. But the preview blew me away. All my services were on there, looked proper professional. Phone's been busier since it went live.",
    name: "Turner Electrical",
    business: "Electrical Contractor · Birmingham",
    rating: 5,
    initials: "TE",
    accent: "amber",
    avatar: "/images/testimonials/turner-electrical-logo.png",
  },
  {
    quote:
      "I'm not great with tech so I was nervous about the whole thing, but they handled absolutely everything. Just told them what I wanted and they came back with something really lovely. My clients keep telling me how nice my website looks.",
    name: "Booth Beauty Studio",
    business: "Beauty & Aesthetics · Manchester",
    rating: 5,
    initials: "BB",
    accent: "violet",
    avatar: "/images/testimonials/booth-beauty-logo.png",
  },
  {
    quote:
      "Had a website before but it looked terrible on phones and I was getting nothing from it. The new one is night and day. Monthly maintenance means I don't have to worry about it at all, which suits me perfectly.",
    name: "Whitfield Roofing",
    business: "Roofing Specialist · Sheffield",
    rating: 5,
    initials: "WR",
    accent: "cyan",
    avatar: "/images/testimonials/whitfield-roofing-logo.png",
  },
  {
    quote:
      "Quick turnaround, looked the business, and the team came through with a few changes I asked for no problem. Site's been running a few months now and we're getting steady enquiries through it every week.",
    name: "Renshaw Groundworks",
    business: "Groundworks & Civil Engineering · Chelmsford",
    rating: 5,
    initials: "RG",
    accent: "emerald",
    avatar: "/images/testimonials/renshaw-groundworks-logo.png",
  },
  {
    quote:
      "My Instagram does most of the work but I wanted something more professional for clients who Google us. Looks exactly how I imagined it, loads fast, and everything just worked first time. Really happy with it.",
    name: "LP Nails & Beauty",
    business: "Nail Salon & Beauty · Coventry",
    rating: 5,
    initials: "LP",
    accent: "blue",
    avatar: "/images/testimonials/lp-nails-logo.png",
  },
];

/** True when every entry is still a placeholder (no real reviews added yet). */
export const HAS_REAL_TESTIMONIALS = TESTIMONIALS.some((t) => !t.isPlaceholder);
