import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/marketing/navbar";
import Footer from "@/components/marketing/footer";
import MotionProvider from "@/components/marketing/motion-provider";
import Tracker from "@/components/tracking/tracker";

export const metadata: Metadata = {
  title: {
    default: "Riden Technologies | Web Design Agency London",
    template: "%s | Riden Technologies",
  },
  description:
    "Riden Technologies builds premium websites, automation systems, and CRM platforms that transform businesses and drive measurable growth.",
  keywords: [
    "website design",
    "business automation",
    "CRM platform",
    "lead generation",
    "digital agency",
    "UK web agency",
  ],
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MotionProvider>
      <div className="public-site">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </div>
      <Suspense fallback={null}>
        <Tracker />
      </Suspense>
    </MotionProvider>
  );
}
