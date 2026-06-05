import { Metadata } from "next";
import BriefFormClient from "./BriefFormClient";

export const metadata: Metadata = {
  title: "Free Website Brief — Riden Technologies",
  description: "Tell us about your business and we'll create a free personalised website concept for you.",
};

export default async function ClientBriefPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <BriefFormClient token={token} />;
}
