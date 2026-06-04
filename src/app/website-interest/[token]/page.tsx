import { Metadata } from "next";
import InterestFormClient from "./InterestFormClient";

export const metadata: Metadata = {
  title: "Your Website Preview — Riden Technologies",
  description: "Let us know if you're interested and we'll get your website live quickly.",
};

export default async function InterestFormPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InterestFormClient token={token} />;
}
