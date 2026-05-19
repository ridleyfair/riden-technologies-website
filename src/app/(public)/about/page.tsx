import type { Metadata } from "next";
import AboutPage from "@/components/marketing/about-page";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Riden Technologies — the team, mission, and vision behind the platform.",
};

export default function About() {
  return <AboutPage />;
}
