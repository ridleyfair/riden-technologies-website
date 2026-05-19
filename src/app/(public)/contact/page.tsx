import type { Metadata } from "next";
import ContactPage from "@/components/marketing/contact-page";

export const metadata: Metadata = {
  title: "Contact",
  description: "Book a free strategy call with Riden Technologies and transform your business.",
};

export default function Contact() {
  return <ContactPage />;
}
