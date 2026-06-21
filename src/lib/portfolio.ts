// ─── Portfolio / Example Sites ────────────────────────────────────────────────
// Edit this file to manage the "Websites We've Built" section on the homepage.
//
// To add a real screenshot: drop a 16:10 image into /public/images/portfolio/
// (e.g. begu.png) and set `image: "/images/portfolio/begu.png"`. If `image` is
// omitted, a branded gradient placeholder is shown automatically — so the
// section never displays a broken image.
//
// `url`  → if set, the "View Website" button links to the live site (new tab).
//          if omitted, the card shows a "Get a site like this" button to /contact.

export interface PortfolioItem {
  name: string;
  industry: string;
  location: string;
  /** Live site URL. Omit if the site isn't public yet. */
  url?: string;
  /** Path under /public, e.g. "/images/portfolio/begu.png". Omit for placeholder. */
  image?: string;
  /** Short outcome / blurb shown under the title. */
  blurb: string;
  /** Accent gradient + emoji used for the placeholder tile. */
  accent: "blue" | "violet" | "cyan" | "emerald" | "amber";
}

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    name: "BEGU Carpentry Ltd",
    industry: "Carpentry & Joinery",
    location: "London, UK",
    url: "https://begucarpentry.com",
    blurb: "Bespoke carpentry website with gallery, reviews and enquiry forms — live and ranking.",
    accent: "amber",
  },
  {
    name: "Hartley Home Renovations",
    industry: "Kitchens & Bathrooms",
    location: "Birmingham, UK",
    url: "https://hartleyhomerenovations.uk",
    image: "/images/portfolio/hartley-renovations.jpg",
    blurb: "Showroom-quality renovation site with a full project gallery, before/after sliders and consultation booking.",
    accent: "emerald",
  },
  {
    name: "Elmcroft Landscapes",
    industry: "Landscaping & Garden Design",
    location: "Surrey, UK",
    url: "https://elmcroftlandscapes.uk",
    image: "/images/portfolio/elmcroft-landscapes.jpg",
    blurb: "Garden transformation specialist with a stunning before/after portfolio and instant quote requests.",
    accent: "cyan",
  },
  {
    name: "Plumbing & Heating Co.",
    industry: "Plumbing & Heating",
    location: "Manchester, UK",
    blurb: "Emergency call-out site built to capture urgent local enquiries fast.",
    accent: "blue",
  },
  {
    name: "Beauty Therapy Studio",
    industry: "Beauty & Wellness",
    location: "Birmingham, UK",
    blurb: "Elegant booking-ready website with treatment menu and online enquiries.",
    accent: "violet",
  },
  {
    name: "Electrical Services",
    industry: "Electrician",
    location: "Leeds, UK",
    blurb: "Trust-focused site with certifications, service areas and instant contact.",
    accent: "cyan",
  },
];
