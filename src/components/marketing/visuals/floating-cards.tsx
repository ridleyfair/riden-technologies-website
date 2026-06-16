// ─── Coded floating proof cards ──────────────────────────────────────────────
// Small glassy pills that float over hero visuals. Icon + single label only.

import {
  MailCheck,
  ShieldCheck,
  TrendingUp,
  Phone,
  Wrench,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

function CardShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("glass-panel rounded-2xl px-3.5 py-2.5 text-slate-900", className)}>
      {children}
    </div>
  );
}

export function EnquiryCard({ className }: { className?: string }) {
  return (
    <CardShell className={className}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
          <MailCheck className="h-3.5 w-3.5" />
        </span>
        <span className="whitespace-nowrap text-[11px] font-bold text-slate-900">New enquiry received</span>
      </div>
    </CardShell>
  );
}

export function CallCard({ className }: { className?: string }) {
  return (
    <CardShell className={className}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
          <Phone className="h-3.5 w-3.5" />
        </span>
        <span className="whitespace-nowrap text-[11px] font-bold text-slate-900">Missed-call free</span>
      </div>
    </CardShell>
  );
}

export function SeoCard({ className }: { className?: string }) {
  return (
    <CardShell className={className}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white">
          <TrendingUp className="h-3.5 w-3.5" />
        </span>
        <span className="whitespace-nowrap text-[11px] font-bold text-slate-900">Ranking on Google</span>
      </div>
    </CardShell>
  );
}

export function MaintenanceCard({ className }: { className?: string }) {
  return (
    <CardShell className={className}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white">
          <ShieldCheck className="h-3.5 w-3.5" />
        </span>
        <span className="whitespace-nowrap text-[11px] font-bold text-slate-900">Hosted &amp; secure</span>
      </div>
    </CardShell>
  );
}

export function UpdateCard({ className }: { className?: string }) {
  return (
    <CardShell className={className}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
          <Wrench className="h-3.5 w-3.5" />
        </span>
        <span className="whitespace-nowrap text-[11px] font-bold text-slate-900">Updated same day</span>
      </div>
    </CardShell>
  );
}

export function RatingCard({ className }: { className?: string }) {
  return (
    <CardShell className={className}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-white">
          <Star className="h-3.5 w-3.5 fill-current" />
        </span>
        <span className="whitespace-nowrap text-[11px] font-bold text-slate-900">5.0 average</span>
      </div>
    </CardShell>
  );
}
