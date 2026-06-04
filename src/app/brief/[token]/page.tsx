import { Metadata } from "next";
import BriefFormClient from "./BriefFormClient";

export const metadata: Metadata = {
  title: "Website Brief — Riden Technologies",
  description: "Tell us about your business so we can build your perfect website.",
};

export default async function BriefFormPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <BriefFormClient token={token} />;
}
