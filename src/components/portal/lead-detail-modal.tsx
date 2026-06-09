"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Mail, Phone, Building2, Calendar, Tag, Star, ExternalLink,
  FolderPlus, CheckCircle, ArrowRight, Video, Copy, Clock,
  AlertTriangle, RefreshCw, XCircle, CalendarPlus, ChevronDown, Sparkles,
} from "lucide-react";
import { buildWebsitePreviewEmail, openEmailCompose } from "@/lib/email-outreach";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type ScraperData = {
  name?: string;
  phone?: string | null;
  category?: string | null;
  city?: string | null;
  address?: string | null;
  rating?: number | null;
  reviews_count?: number | null;
  website?: string | null;
  maps_url?: string | null;
  lead_tier?: string | null;
  description?: string | null;
  photos?: string[];
  opening_hours?: { day: string; hours: string }[];
  social_facebook?: string | null;
  social_instagram?: string | null;
  checkatrade?: {
    url?: string;
    review_count?: number;
    rating?: number;
    confidence?: number;
  } | null;
};

type Lead = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company: string | null;
  service: string | null;
  message: string;
  notes?: string | null;
  scraperDataJson?: string | null;
  status: string;
  source: string;
  score: number;
  value?: number | null;
  createdAt: string;
  // Booking fields
  bookingStatus?: string | null;
  meetingTitle?: string | null;
  meetingDate?: string | null;
  meetingTime?: string | null;
  meetingTimezone?: string | null;
  meetingDurationMins?: number | null;
  microsoftEventId?: string | null;
  teamsJoinUrl?: string | null;
  inviteSentAt?: string | null;
  bookingNotes?: string | null;
};

const statusOptions = ["new", "contacted", "qualified", "proposal", "won", "lost"];

const statusColors: Record<string, "default" | "violet" | "cyan" | "warning" | "success" | "destructive" | "secondary"> = {
  new: "default",
  contacted: "violet",
  qualified: "cyan",
  proposal: "warning",
  won: "success",
  lost: "destructive",
};

const bookingStatusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  not_scheduled: { label: "Not Scheduled", color: "text-slate-400",   bg: "bg-slate-500/10",   dot: "bg-slate-500" },
  invite_sent:   { label: "Invite Sent",   color: "text-emerald-400", bg: "bg-emerald-500/10", dot: "bg-emerald-400" },
  accepted:      { label: "Accepted",      color: "text-green-400",   bg: "bg-green-500/10",   dot: "bg-green-400" },
  declined:      { label: "Declined",      color: "text-red-400",     bg: "bg-red-500/10",     dot: "bg-red-400" },
  completed:     { label: "Completed",     color: "text-violet-400",  bg: "bg-violet-500/10",  dot: "bg-violet-400" },
  cancelled:     { label: "Cancelled",     color: "text-slate-500",   bg: "bg-slate-500/10",   dot: "bg-slate-600" },
};

// ── Shared input style ────────────────────────────────────────────────────────

const inputCls = "w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors";

// ── Intake brief parser ───────────────────────────────────────────────────────

function parseBriefValue(message: string, key: string): string {
  const regex = new RegExp(`^${key}:\\s*(.+)$`, "mi");
  const m = message.match(regex);
  return m ? m[1].trim() : "";
}

function estimateBudget(service: string | null, message: string): number {
  const planLine = service || parseBriefValue(message, "Selected plan");
  const lower = planLine.toLowerCase();
  if (lower.includes("enterprise")) return 1000;
  if (lower.includes("pro")) return 500;
  if (lower.includes("starter")) return 150;
  if (lower.includes("1,000") || lower.includes("1000")) return 1000;
  if (lower.includes("500")) return 500;
  if (lower.includes("150")) return 150;
  return 0;
}

function parseDueDate(message: string): string {
  const raw = parseBriefValue(message, "Deadline");
  if (!raw || raw === "None") return "";
  const lower = raw.toLowerCase();
  const now = new Date();
  if (lower.includes("week")) {
    const match = lower.match(/(\d+)\s*week/);
    const weeks = match ? parseInt(match[1]) : 2;
    const d = new Date(now); d.setDate(d.getDate() + weeks * 7);
    return d.toISOString().split("T")[0];
  }
  if (lower.includes("month")) {
    const match = lower.match(/(\d+)\s*month/);
    const months = match ? parseInt(match[1]) : 1;
    const d = new Date(now); d.setMonth(d.getMonth() + months);
    return d.toISOString().split("T")[0];
  }
  const attempt = new Date(raw);
  if (!isNaN(attempt.getTime())) return attempt.toISOString().split("T")[0];
  return "";
}

function IntakeBrief({ text }: { text: string }) {
  if (!text.includes("=== WEBSITE INTAKE BRIEF ===")) {
    return <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{text}</p>;
  }
  const sections: { heading: string; lines: string[] }[] = [];
  let current: { heading: string; lines: string[] } | null = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line === "=== WEBSITE INTAKE BRIEF ===") continue;
    const isHeading = /^[A-Z][A-Z\s&\/]+$/.test(line) && line.length < 30;
    if (isHeading) { if (current) sections.push(current); current = { heading: line, lines: [] }; }
    else if (current && line) current.lines.push(line);
  }
  if (current) sections.push(current);
  if (sections.length === 0) return <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{text}</p>;
  return (
    <div className="space-y-4">
      {sections.map((s) => (
        <div key={s.heading}>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{s.heading}</div>
          <div className="space-y-1">
            {s.lines.map((line, i) => {
              const colonIdx = line.indexOf(":");
              if (colonIdx > 0 && colonIdx < 30) {
                return (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="text-slate-500 flex-shrink-0 min-w-[120px]">{line.slice(0, colonIdx).trim()}</span>
                    <span className="text-slate-200">{line.slice(colonIdx + 1).trim() || "—"}</span>
                  </div>
                );
              }
              return <p key={i} className="text-sm text-slate-300">{line}</p>;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Scraper → brief mapper ────────────────────────────────────────────────────

const BEAUTY_KEYWORDS_LC = [
  "beauty", "salon", "nail", "lash", "brow", "aesthetics", "aesthetic",
  "skincare", "skin care", "spa", "massage", "wax", "threading", "microblading",
  "tattoo", "permanent makeup", "hair salon", "hairdresser", "barber",
];

function detectIndustry(category: string | null): "beauty" | "trades" {
  if (!category) return "trades";
  const lc = category.toLowerCase();
  return BEAUTY_KEYWORDS_LC.some(kw => lc.includes(kw)) ? "beauty" : "trades";
}

function extractUkPostcode(address: string | null): string | null {
  if (!address) return null;
  const m = address.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i);
  return m ? m[1].toUpperCase() : null;
}

function formatReviewCount(n: number): string {
  if (n < 10) return String(n);
  return `${Math.floor(n / 10) * 10}+`;
}

type BriefPreFill = {
  phone:           string | null;
  city:            string | null;
  postcode:        string | null;
  industry:        "beauty" | "trades";
  services:        string | null;
  about:           string | null;
  accreditations:  string | null;
  photosJson:      Record<string, unknown> | null;
  openingHours:    string | null;
  socialFacebook:  string | null;
  socialInstagram: string | null;
  hasData:         boolean;
  checkatradeUrl:  string | null;
  existingWebsite: string | null;
  googleRating:    string | null;
  reviewCount:     number | null;
};

function formatOpeningHours(hours: { day: string; hours: string }[]): string | null {
  if (!hours || hours.length === 0) return null;
  return hours.map(h => `${h.day}: ${h.hours}`).join(", ");
}

function buildBriefFromLead(lead: Lead): BriefPreFill {
  // Try structured scraperDataJson first
  let sd: ScraperData | null = null;
  if (lead.scraperDataJson) {
    try { sd = JSON.parse(lead.scraperDataJson) as ScraperData; } catch { /* ignore */ }
  }

  if (sd) {
    const industry = detectIndustry(sd.category ?? null);
    const postcode = extractUkPostcode(sd.address ?? null);

    // Prefer Checkatrade reviews, fall back to Google
    const hasCT        = !!sd.checkatrade?.url;
    const ctRating     = sd.checkatrade?.rating    ?? null;
    const ctCount      = sd.checkatrade?.review_count ?? null;
    const gRating      = sd.rating          ?? null;
    const gCount       = sd.reviews_count   ?? null;

    const reviewCount  = hasCT ? (ctCount ?? gCount ?? null) : (gCount ?? null);
    const avgRating    = hasCT && ctRating != null
      ? `${ctRating}/10`
      : gRating != null ? `${gRating}/5` : null;
    const platform     = hasCT ? "Checkatrade" : "Google";
    const platformUrl  = hasCT ? (sd.checkatrade?.url ?? null) : (sd.maps_url ?? null);
    const displayCount = reviewCount != null ? formatReviewCount(reviewCount) : null;

    // Build photosJson: review badge settings + gallery images from scraper photos
    const reviewSettings = reviewCount != null ? {
      platform,
      reviewCount,
      displayReviewCount: displayCount,
      averageRating: avgRating,
      platformUrl,
      showReviewBadge: true,
      showRatingBadge: true,
    } : null;

    const photos = sd.photos ?? [];
    const photosJson: Record<string, unknown> | null =
      (reviewSettings || photos.length > 0)
        ? {
            ...(reviewSettings ? { reviewSettings } : {}),
            ...(photos.length > 0 ? { gallery: photos.map((url, i) => ({ url, caption: `Photo ${i + 1}` })) } : {}),
          }
        : null;

    const accredParts: string[] = [];
    if (hasCT && sd.checkatrade?.url) accredParts.push(`Checkatrade: ${sd.checkatrade.url}`);

    return {
      phone:           sd.phone            ?? lead.phone ?? null,
      city:            sd.city             ?? null,
      postcode,
      industry,
      services:        sd.category         ?? lead.service ?? null,
      about:           sd.description      ?? null,
      accreditations:  accredParts.length ? accredParts.join(", ") : null,
      photosJson,
      openingHours:    formatOpeningHours(sd.opening_hours ?? []),
      socialFacebook:  sd.social_facebook  ?? null,
      socialInstagram: sd.social_instagram ?? null,
      hasData:         true,
      checkatradeUrl:  sd.checkatrade?.url ?? null,
      existingWebsite: sd.website          ?? null,
      googleRating:    gRating != null ? `${gRating}/5 (${gCount ?? 0} reviews)` : null,
      reviewCount,
    };
  }

  // Fallback: only use existing Lead fields (older imports)
  return {
    phone:           lead.phone  ?? null,
    city:            null,
    postcode:        null,
    industry:        detectIndustry(lead.service),
    services:        lead.service ?? null,
    about:           null,
    accreditations:  null,
    photosJson:      null,
    openingHours:    null,
    socialFacebook:  null,
    socialInstagram: null,
    hasData:         !!(lead.phone || lead.service),
    checkatradeUrl:  null,
    existingWebsite: null,
    googleRating:    null,
    reviewCount:     null,
  };
}

// ── Create Project modal ──────────────────────────────────────────────────────

function CreateProjectModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const deadlineRaw      = parseBriefValue(lead.message, "Deadline");
  const estimatedBudget  = estimateBudget(lead.service, lead.message);
  const brief            = buildBriefFromLead(lead);

  const [form, setForm] = useState({
    name:       lead.company ? `${lead.company} Website` : `${lead.name} Website`,
    clientName: lead.company || lead.name,
    budget:     estimatedBudget > 0 ? String(estimatedBudget) : "",
    dueDate:    parseDueDate(lead.message),
    notes:      [
      lead.source === "scraper" && brief.existingWebsite && `Existing website: ${brief.existingWebsite}`,
      lead.source === "scraper" && brief.googleRating    && `Google rating: ${brief.googleRating}`,
      lead.service && lead.source !== "scraper" && `Plan: ${lead.service}`,
      deadlineRaw && deadlineRaw !== "None" && `Requested deadline: ${deadlineRaw}`,
      parseBriefValue(lead.message, "Services/products") && `Services: ${parseBriefValue(lead.message, "Services/products")}`,
      parseBriefValue(lead.message, "Style preference")  && `Style: ${parseBriefValue(lead.message, "Style preference")}`,
      parseBriefValue(lead.message, "Brand colours")     && `Colours: ${parseBriefValue(lead.message, "Brand colours")}`,
    ].filter(Boolean).join("\n"),
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  async function handleCreate() {
    if (!form.name.trim()) { setError("Project name is required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:            form.name.trim(),
          clientName:      form.clientName.trim(),
          status:          "in_progress",
          budget:          parseFloat(form.budget) || 0,
          spent:           0,
          progress:        0,
          dueDate:         form.dueDate || null,
          notes:           form.notes,
          // Brief fields auto-mapped from scraper data
          phone:           brief.phone           || null,
          city:            brief.city            || null,
          postcode:        brief.postcode        || null,
          industry:        brief.industry,
          services:        brief.services        || null,
          about:           brief.about           || null,
          accreditations:  brief.accreditations  || null,
          photosJson:      brief.photosJson      || null,
          openingHours:    brief.openingHours    || null,
          socialFacebook:  brief.socialFacebook  || null,
          socialInstagram: brief.socialInstagram || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to create project."); return; }
      const project = await res.json();
      setCreatedId(project.id);
    } catch { setError("Network error. Please try again."); } finally { setSaving(false); }
  }

  if (createdId) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
          <CheckCircle size={28} className="text-emerald-400" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">Project Created</h3>
        <p className="text-sm text-slate-400 mb-5"><span className="text-white font-medium">{form.name}</span> is now live in your projects board.</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Stay here</Button>
          <Link href="/portal/projects"><Button variant="gradient" size="sm">View Projects <ArrowRight size={13} /></Button></Link>
        </div>
      </div>
    );
  }

  const photoCount = (brief.photosJson as { gallery?: unknown[] } | null)?.gallery?.length ?? 0;
  const briefRows = [
    brief.phone          && ["Phone",       brief.phone],
    brief.city           && ["City",        brief.city],
    brief.postcode       && ["Postcode",    brief.postcode],
    brief.services       && ["Services",    brief.services],
    brief.industry       && ["Industry",    brief.industry.charAt(0).toUpperCase() + brief.industry.slice(1)],
    brief.about          && ["About",       brief.about.length > 60 ? brief.about.slice(0, 60) + "…" : brief.about],
    brief.openingHours   && ["Hours",       brief.openingHours.length > 50 ? brief.openingHours.slice(0, 50) + "…" : brief.openingHours],
    brief.socialFacebook  && ["Facebook",   brief.socialFacebook],
    brief.socialInstagram && ["Instagram",  brief.socialInstagram],
    brief.checkatradeUrl  && ["Checkatrade","Profile found"],
    brief.googleRating   && ["Google",      brief.googleRating],
    brief.accreditations && ["Accreditations", brief.accreditations.length > 50 ? brief.accreditations.slice(0, 50) + "…" : brief.accreditations],
    (brief.photosJson && (brief.reviewCount != null || photoCount > 0)) && ["Media", `${photoCount > 0 ? `${photoCount} photos` : ""}${photoCount > 0 && brief.reviewCount != null ? " · " : ""}${brief.reviewCount != null ? `reviews from ${brief.checkatradeUrl ? "Checkatrade" : "Google"}` : ""}`],
  ].filter(Boolean) as [string, string][];

  return (
    <div className="space-y-4 py-1">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs text-slate-400 mb-1.5">Project Name</label>
          <input value={form.name} onChange={set("name")} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Client Name</label>
          <input value={form.clientName} onChange={set("clientName")} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Budget (£){estimatedBudget > 0 && <span className="ml-1.5 text-[10px] text-blue-400">estimated from plan</span>}</label>
          <input type="number" min="0" value={form.budget} onChange={set("budget")} placeholder="0" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Due Date{deadlineRaw && deadlineRaw !== "None" && <span className="ml-1.5 text-[10px] text-slate-500">({deadlineRaw})</span>}</label>
          <input type="date" value={form.dueDate} onChange={set("dueDate")} className={inputCls} />
        </div>
        <div className="flex items-center gap-2 bg-riden-surface rounded-xl border border-riden-border px-3 py-2.5">
          <span className="text-xs text-slate-500">Status</span>
          <span className="ml-auto text-xs font-medium text-amber-400">In Progress</span>
        </div>
      </div>

      {/* Auto-filled brief preview */}
      {briefRows.length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={11} className="text-emerald-400" />
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
              {lead.scraperDataJson ? "Auto-filled from Google Maps scraper" : "Pre-filled from lead data"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {briefRows.map(([label, value]) => (
              <div key={label} className="flex gap-1.5 items-baseline min-w-0">
                <span className="text-[10px] text-slate-500 shrink-0 w-20">{label}</span>
                <span className="text-[11px] text-slate-300 truncate">{value}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">These fields will be pre-filled in the website brief. You can edit them in the project.</p>
        </div>
      )}

      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
        <textarea rows={3} value={form.notes} onChange={set("notes")} className={`${inputCls} resize-none`} />
      </div>
      {error && <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="gradient" size="sm" onClick={handleCreate} disabled={saving}>
          <FolderPlus size={13} />{saving ? "Creating..." : "Create Project"}
        </Button>
      </div>
    </div>
  );
}

// ── Booking panel ─────────────────────────────────────────────────────────────

type BookingForm = {
  date: string;
  time: string;
  durationMins: number;
  timezone: string;
  title: string;
  notes: string;
};

type BookingLocal = {
  status: string;
  teamsJoinUrl: string;
  meetingDate: string;
  meetingTime: string;
  meetingDurationMins: number;
  meetingTitle: string;
  inviteSentAt: string;
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatMeetingDateTime(date: string, time: string): string {
  if (!date) return "—";
  const d = new Date(`${date}T${time ?? "00:00"}:00`);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) +
    (time ? ` at ${time}` : "");
}

function BookingPanel({ lead, leadId }: { lead: Lead; leadId: string }) {
  const initStatus = lead.bookingStatus ?? "not_scheduled";

  const [booking, setBooking] = useState<BookingLocal>({
    status: initStatus,
    teamsJoinUrl: lead.teamsJoinUrl ?? "",
    meetingDate: lead.meetingDate ?? "",
    meetingTime: lead.meetingTime ?? "",
    meetingDurationMins: lead.meetingDurationMins ?? 30,
    meetingTitle: lead.meetingTitle ?? "Riden Technologies Strategy Call",
    inviteSentAt: lead.inviteSentAt ?? "",
  });

  const [mode, setMode] = useState<"view" | "schedule">(
    initStatus === "invite_sent" ? "view" : "schedule"
  );

  const [form, setForm] = useState<BookingForm>({
    date: lead.meetingDate ?? todayStr(),
    time: lead.meetingTime ?? "10:00",
    durationMins: lead.meetingDurationMins ?? 30,
    timezone: lead.meetingTimezone ?? "Europe/London",
    title: lead.meetingTitle ?? "Riden Technologies Strategy Call",
    notes: lead.bookingNotes ?? "",
  });

  const [sendState, setSendState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDuplicateConflict, setIsDuplicateConflict] = useState(false);
  const [copied, setCopied] = useState(false);
  const isRescheduling = booking.status === "invite_sent" && mode === "schedule";

  function setField(field: keyof BookingForm, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSend(forceResend = false) {
    if (!form.date) { setErrorMsg("Please select a meeting date."); setSendState("error"); return; }
    if (!form.time) { setErrorMsg("Please select a meeting time."); setSendState("error"); return; }

    setSendState("sending");
    setErrorMsg("");
    setIsDuplicateConflict(false);

    try {
      // Use PATCH for rescheduling, POST for new invite
      const isUpdate = isRescheduling && !forceResend;
      const url = `/api/leads/${leadId}/teams-invite`;
      const method = isUpdate ? "PATCH" : "POST";
      const body = isUpdate
        ? { date: form.date, time: form.time, durationMinutes: form.durationMins, timezone: form.timezone, title: form.title }
        : { date: form.date, time: form.time, durationMinutes: form.durationMins, timezone: form.timezone, title: form.title, notes: form.notes, forceResend };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "DUPLICATE_INVITE") {
          setIsDuplicateConflict(true);
          setSendState("error");
          setErrorMsg("An invite has already been sent. Click 'Send New Invite' to replace it.");
          return;
        }
        throw new Error(data.error ?? "Failed to send invite");
      }

      setBooking({
        status: "invite_sent",
        teamsJoinUrl: data.teamsJoinUrl ?? booking.teamsJoinUrl,
        meetingDate: form.date,
        meetingTime: form.time,
        meetingDurationMins: form.durationMins,
        meetingTitle: form.title,
        inviteSentAt: new Date().toISOString(),
      });
      setSendState("success");
      setMode("view");
    } catch (err) {
      setSendState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function handleCancel() {
    if (!confirm("Cancel this Teams meeting? The calendar invite will be removed for both you and the client.")) return;
    setSendState("sending");
    try {
      const res = await fetch(`/api/leads/${leadId}/teams-invite`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to cancel");
      setBooking((b) => ({ ...b, status: "cancelled", teamsJoinUrl: "", meetingDate: "", meetingTime: "" }));
      setMode("schedule");
      setSendState("idle");
    } catch (err) {
      setSendState("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to cancel meeting");
    }
  }

  function handleCopyLink() {
    if (!booking.teamsJoinUrl) return;
    navigator.clipboard.writeText(booking.teamsJoinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const bsConfig = bookingStatusConfig[booking.status] ?? bookingStatusConfig.not_scheduled;

  return (
    <div className="bg-riden-surface rounded-xl border border-riden-border overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-riden-border">
        <div className="flex items-center gap-2">
          <Video size={14} className="text-blue-400" />
          <span className="text-sm font-semibold text-white">Teams Meeting</span>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${bsConfig.bg} ${bsConfig.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${bsConfig.dot} ${booking.status === "invite_sent" ? "" : ""}`} />
          {bsConfig.label}
        </div>
      </div>

      <div className="p-4">
        {/* ── INVITE SENT — show meeting details ── */}
        {booking.status === "invite_sent" && mode === "view" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-riden-muted rounded-lg p-3 border border-riden-border">
                <div className="text-slate-500 mb-1">Date & Time</div>
                <div className="text-white font-medium">{formatMeetingDateTime(booking.meetingDate, booking.meetingTime)}</div>
              </div>
              <div className="bg-riden-muted rounded-lg p-3 border border-riden-border">
                <div className="text-slate-500 mb-1">Duration</div>
                <div className="text-white font-medium">{booking.meetingDurationMins} minutes</div>
              </div>
              <div className="col-span-2 bg-riden-muted rounded-lg p-3 border border-riden-border">
                <div className="text-slate-500 mb-1">Meeting Title</div>
                <div className="text-white font-medium">{booking.meetingTitle}</div>
              </div>
              <div className="col-span-2 bg-riden-muted rounded-lg p-3 border border-riden-border">
                <div className="text-slate-500 mb-1">Client</div>
                <div className="text-white font-medium">{lead.email}</div>
              </div>
            </div>

            {/* Teams join link */}
            {booking.teamsJoinUrl && (
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={booking.teamsJoinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-600/20 transition-colors"
                >
                  <Video size={14} /> Join Meeting
                </a>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-riden-muted border border-riden-border text-slate-300 text-sm font-medium hover:text-white hover:border-slate-500 transition-colors"
                >
                  {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>
            )}

            {/* Reschedule / Cancel */}
            <div className="flex gap-2">
              <button
                onClick={() => { setMode("schedule"); setSendState("idle"); setErrorMsg(""); }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-riden-border text-slate-400 text-xs font-medium hover:text-white hover:border-slate-500 transition-colors"
              >
                <RefreshCw size={12} /> Reschedule
              </button>
              <button
                onClick={handleCancel}
                disabled={sendState === "sending"}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-rose-500/20 text-rose-400 text-xs font-medium hover:bg-rose-500/10 transition-colors disabled:opacity-50"
              >
                <XCircle size={12} /> Cancel Meeting
              </button>
            </div>
          </div>
        )}

        {/* ── SCHEDULING FORM ── */}
        {(booking.status !== "invite_sent" || mode === "schedule") && (
          <div className="space-y-3">
            {isRescheduling && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-amber-400">Rescheduling — a new invite will be sent to {lead.email}</p>
                <button onClick={() => { setMode("view"); setSendState("idle"); setErrorMsg(""); }} className="text-xs text-slate-500 hover:text-white transition-colors">Cancel</button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Date *</label>
                <input type="date" lang="en-GB" className={inputCls} value={form.date} min={todayStr()} onChange={(e) => setField("date", e.target.value)} />
                {form.date && (
                  <p className="text-[10px] text-slate-500 mt-1 pl-0.5">
                    {new Date(form.date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Time *</label>
                <input type="time" className={inputCls} value={form.time} onChange={(e) => setField("time", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Duration</label>
                <select className={inputCls} value={form.durationMins} onChange={(e) => setField("durationMins", parseInt(e.target.value))}>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Timezone</label>
                <select className={inputCls} value={form.timezone} onChange={(e) => setField("timezone", e.target.value)}>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="America/New_York">America/New York</option>
                  <option value="America/Los_Angeles">America/LA</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Meeting Title</label>
              <input className={inputCls} value={form.title} onChange={(e) => setField("title", e.target.value)} />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Client Email</label>
              <input className={inputCls + " opacity-60 cursor-not-allowed"} value={lead.email} disabled />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Internal Notes</label>
              <textarea rows={2} className={inputCls + " resize-none"} placeholder="Optional internal notes..." value={form.notes} onChange={(e) => setField("notes", e.target.value)} />
            </div>

            {/* Error state */}
            {sendState === "error" && (
              <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5">
                <AlertTriangle size={14} className="text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-rose-300">{errorMsg}</p>
                  {isDuplicateConflict && (
                    <button
                      onClick={() => handleSend(true)}
                      className="mt-2 text-xs text-rose-400 underline hover:text-rose-300 transition-colors"
                    >
                      Send New Invite (replaces existing)
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Send button */}
            <button
              onClick={() => handleSend(false)}
              disabled={sendState === "sending"}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sendState === "sending" ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  {isRescheduling ? "Updating invite..." : "Sending Teams invite..."}
                </>
              ) : (
                <>
                  <CalendarPlus size={15} />
                  {isRescheduling ? "Update Teams Invite" : "Send Teams Invite"}
                </>
              )}
            </button>

            {/* What happens note */}
            {sendState !== "sending" && (
              <p className="text-[10px] text-slate-600 text-center">
                Creates a real Teams calendar event · Invite sent to {lead.email} · Stored in shared mailbox
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Lead detail modal ─────────────────────────────────────────────────────────

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onDelete: (lead: Lead) => void;
}

export default function LeadDetailModal({ lead, onClose, onStatusChange, onDelete }: LeadDetailModalProps) {
  const [localLead, setLocalLead] = useState<Lead | null>(lead);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [linkedSite, setLinkedSite] = useState<{ id: string; previewUrl: string; businessName: string; outreachEmail?: string } | null>(null);

  // Sync when parent passes a new lead
  useEffect(() => { setLocalLead(lead); setShowCreateProject(false); setBookingOpen(false); }, [lead]);

  // Check if a GeneratedSite exists for this lead's company
  useEffect(() => {
    if (!lead?.company) return;
    fetch("/api/generated-sites")
      .then((r) => r.json())
      .then((sites: Array<{ id: string; businessName: string; previewUrl?: string; outreachEmail?: string }>) => {
        const company = lead.company!.toLowerCase();
        const match = sites.find(
          (s) =>
            s.previewUrl &&
            (s.businessName.toLowerCase() === company ||
              s.businessName.toLowerCase().includes(company) ||
              company.includes(s.businessName.toLowerCase()))
        );
        setLinkedSite(match ? { id: match.id, previewUrl: match.previewUrl!, businessName: match.businessName, outreachEmail: match.outreachEmail } : null);
      })
      .catch(() => {});
  }, [lead?.company]);

  if (!localLead) return null;

  const handleStatusChange = async (status: string) => {
    setUpdatingStatus(true);
    await onStatusChange(localLead.id, status);
    setLocalLead((l) => l ? { ...l, status } : l);
    setUpdatingStatus(false);
  };

  const initials = localLead.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <AnimatePresence>
      {lead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }} transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl glass-card rounded-2xl border border-riden-border flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-4 px-5 py-4 border-b border-riden-border flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-white truncate">{localLead.name}</h2>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <a href={`mailto:${localLead.email}`} className="text-xs text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1">
                    <Mail size={11} />{localLead.email}
                  </a>
                  {localLead.phone && (
                    <a href={`tel:${localLead.phone}`} className="text-xs text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1">
                      <Phone size={11} />{localLead.phone}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={statusColors[localLead.status] ?? "secondary"} className="capitalize">{localLead.status}</Badge>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors"><X size={15} /></button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-5 portal-scroll">

              {/* Create project panel */}
              <AnimatePresence>
                {showCreateProject && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
                    className="bg-riden-surface rounded-xl border border-blue-500/20 p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <FolderPlus size={15} className="text-blue-400" />
                      <span className="text-sm font-semibold text-white">Create Project from Lead</span>
                      <button onClick={() => setShowCreateProject(false)} className="ml-auto p-1 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors"><X size={13} /></button>
                    </div>
                    <CreateProjectModal lead={localLead} onClose={() => setShowCreateProject(false)} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Key details */}
              <div className="grid grid-cols-2 gap-3">
                {localLead.company && (
                  <div className="flex items-center gap-2.5 bg-riden-surface rounded-xl p-3 border border-riden-border">
                    <Building2 size={14} className="text-slate-500 flex-shrink-0" />
                    <div className="min-w-0"><div className="text-[10px] text-slate-500">Company</div><div className="text-sm text-white truncate">{localLead.company}</div></div>
                  </div>
                )}
                {localLead.service && (
                  <div className="flex items-center gap-2.5 bg-riden-surface rounded-xl p-3 border border-riden-border">
                    <Tag size={14} className="text-slate-500 flex-shrink-0" />
                    <div className="min-w-0"><div className="text-[10px] text-slate-500">Plan / Service</div><div className="text-sm text-white truncate">{localLead.service}</div></div>
                  </div>
                )}
                <div className="flex items-center gap-2.5 bg-riden-surface rounded-xl p-3 border border-riden-border">
                  <Calendar size={14} className="text-slate-500 flex-shrink-0" />
                  <div><div className="text-[10px] text-slate-500">Submitted</div><div className="text-sm text-white">{new Date(localLead.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div></div>
                </div>
                <div className="flex items-center gap-2.5 bg-riden-surface rounded-xl p-3 border border-riden-border">
                  <ExternalLink size={14} className="text-slate-500 flex-shrink-0" />
                  <div><div className="text-[10px] text-slate-500">Source</div><div className="text-sm text-white capitalize">{localLead.source}</div></div>
                </div>
                {(localLead.score ?? 0) > 0 && (
                  <div className="flex items-center gap-2.5 bg-riden-surface rounded-xl p-3 border border-riden-border">
                    <Star size={14} className="text-amber-400 flex-shrink-0" />
                    <div><div className="text-[10px] text-slate-500">Lead Score</div><div className="text-sm text-white">{localLead.score}</div></div>
                  </div>
                )}
                {(localLead.value ?? 0) > 0 && (
                  <div className="flex items-center gap-2.5 bg-riden-surface rounded-xl p-3 border border-riden-border">
                    <span className="text-emerald-400 font-bold text-xs flex-shrink-0">£</span>
                    <div><div className="text-[10px] text-slate-500">Deal Value</div><div className="text-sm text-white">£{localLead.value}</div></div>
                  </div>
                )}
              </div>

              {/* ── Booking panel (collapsible) ── */}
              <div>
                <button
                  onClick={() => setBookingOpen((o) => !o)}
                  className="w-full flex items-center justify-between group mb-3"
                >
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    <Clock size={10} /> Schedule Teams Meeting
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-slate-500 group-hover:text-slate-300 transition-all duration-200 ${bookingOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {bookingOpen && (
                    <motion.div
                      key="booking-panel"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <BookingPanel lead={localLead} leadId={localLead.id} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Intake brief */}
              {localLead.message && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Website Intake Brief</div>
                  <div className="bg-riden-surface rounded-xl border border-riden-border p-4"><IntakeBrief text={localLead.message} /></div>
                </div>
              )}

              {/* Notes */}
              {localLead.notes && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Notes</div>
                  <div className="bg-riden-surface rounded-xl border border-riden-border p-4"><p className="text-sm text-slate-300 leading-relaxed">{localLead.notes}</p></div>
                </div>
              )}

              {/* Update status */}
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Update Status</div>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((s) => (
                    <button key={s} disabled={updatingStatus || localLead.status === s} onClick={() => handleStatusChange(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize disabled:cursor-not-allowed ${
                        localLead.status === s
                          ? "bg-blue-600/20 border border-blue-500/40 text-blue-300"
                          : "bg-riden-muted border border-riden-border text-slate-400 hover:text-white hover:border-slate-500"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-riden-border flex-shrink-0">
              <button onClick={() => { onDelete(localLead); onClose(); }} className="text-sm text-red-400 hover:text-red-300 transition-colors">Delete lead</button>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {linkedSite && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-violet-400 border-violet-500/30 hover:border-violet-500/60 hover:bg-violet-500/10"
                    onClick={() => {
                      const email = buildWebsitePreviewEmail({
                        businessName: linkedSite.businessName,
                        contactEmail: linkedSite.outreachEmail || localLead.email || "",
                        previewUrl: linkedSite.previewUrl,
                      });
                      openEmailCompose(email);
                      fetch(`/api/generated-sites/${linkedSite.id}/outreach`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "Preview Email Prepared" }),
                      }).catch(() => {});
                    }}
                  >
                    <Sparkles size={13} /> Email Website Preview
                  </Button>
                )}
                {!showCreateProject && (
                  <Button variant="outline" size="sm" onClick={() => setShowCreateProject(true)} className="gap-1.5 text-blue-400 border-blue-500/30 hover:border-blue-500/60">
                    <FolderPlus size={13} /> Create Project
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
