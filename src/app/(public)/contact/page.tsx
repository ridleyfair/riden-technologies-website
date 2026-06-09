import type { Metadata } from "next";
import ContactPage from "@/components/marketing/contact-page";

export const metadata: Metadata = {
  title: "Get a Free Quote — Website Design for Small Businesses UK",
  description:
    "Get a free quote for your new business website. Tell us about your business and we'll have a professional website live in 2–5 business days. No obligation, no hard sell.",
  alternates: { canonical: "https://ridentechnologies.com/contact" },
  openGraph: {
    title: "Get a Free Quote — Website Design UK | Riden Technologies",
    description:
      "Tell us about your business and get a professional website live in 2–5 business days. Free quote, no obligation.",
    url: "https://ridentechnologies.com/contact",
  },
};

export default function Contact() {
  return <ContactPage />;
}
