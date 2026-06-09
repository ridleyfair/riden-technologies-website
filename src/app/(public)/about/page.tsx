import type { Metadata } from "next";
import AboutPage from "@/components/marketing/about-page";

export const metadata: Metadata = {
  title: "About Riden Technologies | London Web Design Agency",
  description:
    "Riden Technologies is a London-based web design agency helping small businesses, tradespeople, and local companies get professional websites that generate real leads. Learn about our mission.",
  alternates: { canonical: "https://ridentechnologies.com/about" },
  openGraph: {
    title: "About Riden Technologies | London Web Design Agency",
    description:
      "London-based web design agency helping small businesses get professional websites that generate real leads.",
    url: "https://ridentechnologies.com/about",
  },
};

export default function About() {
  return <AboutPage />;
}
