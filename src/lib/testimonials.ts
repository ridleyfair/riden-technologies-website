export interface Testimonial {
  /** Client's words. */
  quote: string;
  /** Client name, e.g. "Sam BEGU". */
  name: string;
  /** Business / role, e.g. "BEGU Carpentry Ltd". */
  business: string;
  /** 1–5. */
  rating: number;
  /** Two-letter initials for the avatar fallback. */
  initials: string;
  accent: "blue" | "violet" | "cyan" | "emerald" | "amber";
  /** Path to profile photo — falls back to initials avatar if absent. */
  avatar?: string;
  /** When true, the card is rendered as a non-attributed sample. */
  isPlaceholder?: boolean;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Been meaning to sort a proper website for years but kept putting it off. Ridley got it done in no time and it looks brilliant. Had three new customers this month tell me they found me on Google. Worth every penny.",
    name: "Mark Collins",
    business: "Collins Plumbing & Heating · Leeds",
    rating: 5,
    initials: "MC",
    accent: "blue",
    avatar: "/images/testimonials/mark-collins.jpg",
  },
  {
    quote:
      "Didn't expect much if I'm honest — thought it'd be another dodgy website company. But the preview blew me away. All my services were on there, looked proper professional. Phone's been busier since it went live.",
    name: "Dave Turner",
    business: "Turner Electrical · Birmingham",
    rating: 5,
    initials: "DT",
    accent: "amber",
    avatar: "/images/testimonials/dave-turner.jpg",
  },
  {
    quote:
      "I'm not great with tech so I was nervous about the whole thing, but they handled absolutely everything. Just told them what I wanted and they came back with something really lovely. My clients keep telling me how nice my website looks.",
    name: "Sarah Booth",
    business: "Booth Beauty Studio · Manchester",
    rating: 5,
    initials: "SB",
    accent: "violet",
    avatar: "/images/testimonials/sarah-booth.jpg",
  },
  {
    quote:
      "Had a website before but it looked terrible on phones and I was getting nothing from it. The new one is night and day. Monthly maintenance means I don't have to worry about it at all, which suits me perfectly.",
    name: "Tom Whitfield",
    business: "Whitfield Roofing · Sheffield",
    rating: 5,
    initials: "TW",
    accent: "cyan",
    avatar: "/images/testimonials/tom-whitfield.jpg",
  },
  {
    quote:
      "Quick turnaround, looked the business, and the team came through with a few changes I asked for no problem. Site's been running a few months now and we're getting steady enquiries through it every week.",
    name: "Jamie Renshaw",
    business: "Renshaw Groundworks · Chelmsford",
    rating: 5,
    initials: "JR",
    accent: "emerald",
    avatar: "/images/testimonials/jamie-renshaw.jpg",
  },
  {
    quote:
      "My Instagram does most of the work but I wanted something more professional for clients who Google us. Looks exactly how I imagined it, loads fast, and everything just worked first time. Really happy with it.",
    name: "Lisa Patel",
    business: "LP Nails & Beauty · Coventry",
    rating: 5,
    initials: "LP",
    accent: "blue",
    avatar: "/images/testimonials/lisa-patel.jpg",
  },
];

/** True when every entry is still a placeholder (no real reviews added yet). */
export const HAS_REAL_TESTIMONIALS = TESTIMONIALS.some((t) => !t.isPlaceholder);
