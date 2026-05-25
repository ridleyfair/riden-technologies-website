"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function InviteResponseContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const config = {
    accepted: {
      icon: "✓",
      iconBg: "bg-green-500/20 text-green-400",
      title: "Meeting Accepted",
      message: "Thanks for confirming! We look forward to speaking with you. You'll receive a calendar invite shortly.",
    },
    declined: {
      icon: "✗",
      iconBg: "bg-slate-500/20 text-slate-400",
      title: "Meeting Declined",
      message: "No problem at all. We'll be in touch to find a time that works better for you.",
    },
    invalid: {
      icon: "!",
      iconBg: "bg-red-500/20 text-red-400",
      title: "Invalid Link",
      message: "This link is invalid or has already been used. Please contact us at bookings@ridentechnologies.com.",
    },
  }[status ?? "invalid"] ?? {
    icon: "!",
    iconBg: "bg-red-500/20 text-red-400",
    title: "Something went wrong",
    message: "Please contact us at bookings@ridentechnologies.com.",
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#1e293b] border border-[#334155] rounded-2xl p-8 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-5 ${config.iconBg}`}>
          {config.icon}
        </div>
        <h1 className="text-xl font-bold text-white mb-3">{config.title}</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">{config.message}</p>
        <div className="border-t border-[#334155] pt-6">
          <p className="text-xs text-slate-600">
            Riden Technologies &middot;{" "}
            <a href="https://www.ridentechnologies.com" className="text-slate-500 hover:text-slate-300 transition-colors">
              www.ridentechnologies.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function InviteResponsePage() {
  return (
    <Suspense>
      <InviteResponseContent />
    </Suspense>
  );
}
