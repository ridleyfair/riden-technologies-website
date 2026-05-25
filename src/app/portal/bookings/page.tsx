"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, Plus, Video, User, MoreHorizontal, X,
  Phone, RefreshCw, Trash2, Edit2, CheckCircle, ChevronLeft,
  ChevronRight, ExternalLink, AlertCircle, MapPin, Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Booking = {
  id: string;
  title: string;
  client: string;
  clientEmail?: string | null;
  leadId?: string | null;
  date: string;
  time: string;
  duration: string;
  durationMinutes?: number | null;
  timezone?: string | null;
  type: string;
  status: string;
  notes?: string | null;
  microsoftEventId?: string | null;
  outlookCalendarEmail?: string | null;
  teamsJoinUrl?: string | null;
  attendees?: string | null;
  inviteSentAt?: string | null;
  attendeeResponseStatus?: string | null;
  outlookResponseUpdatedAt?: string | null;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type BookingForm = {
  title: string;
  client: string;
  clientEmail: string;
  date: string;
  time: string;
  duration: string;
  durationMinutes: number;
  type: string;
  status: string;
  notes: string;
  timezone: string;
  createTeamsMeeting: boolean;
};

type ViewMode = "month" | "agenda";

// ── Constants ─────────────────────────────────────────────────────────────────

type BadgeVariant = "success" | "warning" | "destructive" | "secondary" | "violet" | "cyan" | "default";

const STATUS_CONFIG: Record<string, { label: string; variant: BadgeVariant; dot: string; calDot: string }> = {
  awaiting_response: { label: "Awaiting Response", variant: "warning",     dot: "bg-yellow-400",  calDot: "bg-yellow-400" },
  approved:          { label: "Approved",           variant: "success",     dot: "bg-green-400",   calDot: "bg-green-400"  },
  declined:          { label: "Declined",           variant: "destructive", dot: "bg-red-400",     calDot: "bg-red-400"    },
  tentative:         { label: "Tentative",          variant: "violet",      dot: "bg-violet-400",  calDot: "bg-violet-400" },
  cancelled:         { label: "Cancelled",          variant: "secondary",   dot: "bg-slate-500",   calDot: "bg-slate-500"  },
  completed:         { label: "Completed",          variant: "violet",      dot: "bg-violet-400",  calDot: "bg-violet-500" },
  no_show:           { label: "No Show",            variant: "warning",     dot: "bg-orange-400",  calDot: "bg-orange-400" },
  // legacy values — kept for existing data
  confirmed:         { label: "Confirmed",          variant: "success",     dot: "bg-green-400",   calDot: "bg-blue-400"   },
  pending:           { label: "Pending",            variant: "warning",     dot: "bg-yellow-400",  calDot: "bg-yellow-400" },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, variant: "secondary" as BadgeVariant, dot: "bg-slate-500", calDot: "bg-slate-500" };
}

const DURATION_MINS: Record<string, number> = {
  "15 min": 15, "30 min": 30, "45 min": 45, "60 min": 60, "90 min": 90,
};
const DURATIONS = Object.keys(DURATION_MINS);

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getTomorrow(today: string): string {
  const d = new Date(today + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDateLong(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function fmtDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function fmtGroupHeader(dateStr: string, today: string): string {
  const tomorrow = getTomorrow(today);
  const longDate = new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  if (dateStr === today) return `TODAY — ${longDate}`;
  if (dateStr === tomorrow) return `TOMORROW — ${longDate}`;
  return longDate.toUpperCase();
}

function fmtRelative(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function clientLabel(raw: string | undefined | null): string {
  if (!raw || raw.trim() === "" || raw.toLowerCase() === "unknown") return "No client linked";
  return raw;
}

function defaultForm(date?: string): BookingForm {
  return {
    title: "Riden Technologies Strategy Call",
    client: "",
    clientEmail: "",
    date: date ?? todayStr(),
    time: "10:00",
    duration: "30 min",
    durationMinutes: 30,
    type: "video",
    status: "awaiting_response",
    notes: "",
    timezone: "Europe/London",
    createTeamsMeeting: true,
  };
}

function bookingToForm(b: Booking): BookingForm {
  return {
    title: b.title,
    client: b.client,
    clientEmail: b.clientEmail ?? "",
    date: b.date,
    time: b.time,
    duration: b.duration,
    durationMinutes: b.durationMinutes ?? DURATION_MINS[b.duration] ?? 30,
    type: b.type,
    status: b.status,
    notes: b.notes ?? "",
    timezone: b.timezone ?? "Europe/London",
    createTeamsMeeting: false,
  };
}

function getMonthCells(year: number, month: number) {
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells: { dateStr: string; day: number; cur: boolean }[] = [];

  for (let i = firstDow; i > 0; i--) {
    const d = prevDays - i + 1;
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    cells.push({ dateStr: `${py}-${String(pm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, day: d, cur: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, day: d, cur: true });
  }
  let nd = 1;
  while (cells.length % 7 !== 0) {
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    cells.push({ dateStr: `${ny}-${String(nm + 1).padStart(2, "0")}-${String(nd).padStart(2, "0")}`, day: nd++, cur: false });
  }
  return cells;
}

const inputCls =
  "w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors";

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, ok, onClose }: { message: string; ok: boolean; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl border shadow-xl text-sm font-medium",
        ok
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          : "bg-rose-500/10 border-rose-500/30 text-rose-300"
      )}
    >
      {message}
    </motion.div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({ open, title, hasOutlook, onClose, onConfirm }: {
  open: boolean; title: string; hasOutlook: boolean;
  onClose: () => void; onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm glass-card rounded-2xl border border-riden-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={20} className="text-rose-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Delete Booking?</h3>
              <p className="text-sm text-slate-300 font-medium mb-1 truncate px-4">{title}</p>
              {hasOutlook && (
                <p className="text-xs text-slate-500 mt-1">
                  This will also remove the event from the Outlook calendar.
                </p>
              )}
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <Button variant="outline" className="flex-1" onClick={onClose}>Keep</Button>
              <Button variant="destructive" className="flex-1" onClick={onConfirm}>Delete</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Booking Detail Modal ──────────────────────────────────────────────────────

function BookingDetailModal({ booking, onClose, onEdit, onDelete }: {
  booking: Booking | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const TypeIcon = booking?.type === "video" ? Video : booking?.type === "call" ? Phone : MapPin;

  return (
    <AnimatePresence>
      {booking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full sm:max-w-md glass-card rounded-t-2xl sm:rounded-2xl border border-riden-border flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-riden-border" />
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-riden-border flex-shrink-0">
              <h2 className="text-base font-semibold text-white">Booking Details</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto portal-scroll flex-1">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Meeting</div>
                <div className="text-sm font-semibold text-white">{booking.title}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Date</div>
                  <div className="text-sm text-slate-200">{fmtDate(booking.date)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Time</div>
                  <div className="text-sm text-slate-200">{booking.time.slice(0, 5)} · {booking.duration}</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Client</div>
                <div className="text-sm text-slate-200">{clientLabel(booking.client)}</div>
                {booking.clientEmail && (
                  <div className="text-xs text-slate-500 mt-0.5">{booking.clientEmail}</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Status</div>
                  <Badge variant={getStatusConfig(booking.status).variant} className="capitalize">
                    {getStatusConfig(booking.status).label}
                  </Badge>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Type</div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-200">
                    <TypeIcon size={13} className="text-slate-400" />
                    {booking.type === "video" ? "Video Call" : booking.type === "call" ? "Phone Call" : "In Person"}
                  </div>
                </div>
              </div>

              {/* Outlook RSVP response block */}
              {booking.microsoftEventId && (
                <div className="rounded-lg border border-riden-border bg-riden-muted/50 px-4 py-3 space-y-1.5">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Outlook Response</div>
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusConfig(booking.status).dot)} />
                    <span className="text-sm text-slate-200 font-medium">{getStatusConfig(booking.status).label}</span>
                  </div>
                  {booking.inviteSentAt && (
                    <div className="text-xs text-slate-500">
                      Invite sent {new Date(booking.inviteSentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  )}
                  {booking.outlookResponseUpdatedAt && (
                    <div className="text-xs text-slate-500">
                      Response updated {new Date(booking.outlookResponseUpdatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                  {booking.lastSyncedAt && (
                    <div className="text-xs text-slate-600">
                      Last synced {new Date(booking.lastSyncedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>
              )}

              {booking.teamsJoinUrl && booking.status !== "cancelled" && (
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Teams Meeting</div>
                  <a
                    href={booking.teamsJoinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Video size={11} /> Join Microsoft Teams Meeting <ExternalLink size={10} />
                  </a>
                </div>
              )}

              {booking.notes && (
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Notes</div>
                  <div className="text-sm text-slate-300 leading-relaxed">{booking.notes}</div>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-riden-border flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => { onClose(); onDelete(); }} className="flex-1">
                <Trash2 size={13} /> Delete
              </Button>
              <Button variant="gradient" size="sm" onClick={() => { onClose(); onEdit(); }} className="flex-1">
                <Edit2 size={13} /> Edit
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Booking Modal ─────────────────────────────────────────────────────────────

function BookingModal({ open, mode, initial, defaultDate, onClose, onSave }: {
  open: boolean;
  mode: "create" | "edit";
  initial?: Booking | null;
  defaultDate?: string | null;
  onClose: () => void;
  onSave: (graphError?: string | null, emailError?: string | null, emailSent?: boolean) => void;
}) {
  const [form, setForm] = useState<BookingForm>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initial ? bookingToForm(initial) : defaultForm(defaultDate ?? undefined));
      setError("");
    }
  }, [open, initial, defaultDate]);

  function set<K extends keyof BookingForm>(field: K, value: BookingForm[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleDurationChange(d: string) {
    setForm((f) => ({ ...f, duration: d, durationMinutes: DURATION_MINS[d] ?? 30 }));
  }

  async function handleSave() {
    if (!form.title || !form.client || !form.date || !form.time) {
      setError("Title, client, date and time are required.");
      return;
    }
    if (form.createTeamsMeeting && !form.clientEmail) {
      setError("Client email is required to create a Teams meeting.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = mode === "edit" && initial?.id ? `/api/bookings/${initial.id}` : "/api/bookings";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to save.");
        return;
      }
      const data = await res.json();
      onSave(data.graphError ?? null, data.emailError ?? null, data.emailSent ?? false);
      onClose();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full sm:max-w-lg glass-card rounded-t-2xl sm:rounded-2xl border border-riden-border flex flex-col max-h-[92vh] sm:max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-riden-border" />
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-riden-border flex-shrink-0">
              <h2 className="text-base font-semibold text-white">
                {mode === "create" ? "New Booking" : "Edit Booking"}
              </h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto portal-scroll flex-1">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Meeting Title</label>
                <input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Client Name</label>
                  <input className={inputCls} placeholder="John Smith" value={form.client} onChange={(e) => set("client", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Client Email</label>
                  <input type="email" className={inputCls} placeholder="john@company.com" value={form.clientEmail} onChange={(e) => set("clientEmail", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Date</label>
                  <input type="date" lang="en-GB" className={inputCls} value={form.date} onChange={(e) => set("date", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Time</label>
                  <input type="time" className={inputCls} value={form.time} onChange={(e) => set("time", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Duration</label>
                  <select className={inputCls} value={form.duration} onChange={(e) => handleDurationChange(e.target.value)}>
                    {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Meeting Type</label>
                  <select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value)}>
                    <option value="video">Video Call</option>
                    <option value="call">Phone Call</option>
                    <option value="in-person">In Person</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Status</label>
                <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="awaiting_response">Awaiting Response</option>
                  <option value="approved">Approved</option>
                  <option value="tentative">Tentative</option>
                  <option value="declined">Declined</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>
              {mode === "create" && (
                <label className="flex items-start gap-3 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 rounded border-riden-border accent-blue-500 cursor-pointer flex-shrink-0"
                    checked={form.createTeamsMeeting}
                    onChange={(e) => set("createTeamsMeeting", e.target.checked)}
                  />
                  <div>
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      Create Microsoft Teams Meeting
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Creates an Outlook calendar event with a Teams join link and sends an invite to the client
                    </p>
                  </div>
                </label>
              )}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
                <textarea className={inputCls + " resize-none"} rows={3} placeholder="Any extra details..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
              </div>
              {error && (
                <div className="flex items-start gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2.5">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-riden-border flex-shrink-0">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button variant="gradient" className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : mode === "create" ? "Create Booking" : "Save Changes"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Portal Action Menu ────────────────────────────────────────────────────────
// Rendered via createPortal into document.body so no parent overflow:hidden clips it.

const MENU_WIDTH = 210;

function BookingActionMenu({ btnRef, open, onClose, onView, onEdit, onReschedule, onSync, onDelete }: {
  btnRef: React.RefObject<HTMLButtonElement | null>;
  open: boolean;
  onClose: () => void;
  onView: () => void;
  onEdit: () => void;
  onReschedule: () => void;
  onSync: () => void;
  onDelete: () => void;
}) {
  const [coords, setCoords] = useState({ top: 0, left: 0, openUp: false });

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 220;
    let left = rect.right - MENU_WIDTH;
    if (left < 8) left = 8;
    if (left + MENU_WIDTH > window.innerWidth - 8) left = window.innerWidth - MENU_WIDTH - 8;
    setCoords({
      top: openUp ? rect.top - 4 : rect.bottom + 4,
      left,
      openUp,
    });
  }, [open, btnRef]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    function onClick(e: MouseEvent) {
      if (btnRef.current?.contains(e.target as Node)) return;
      onClose();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, onClose, btnRef]);

  if (!open || typeof document === "undefined") return null;

  const style: React.CSSProperties = {
    position: "fixed",
    top: coords.openUp ? undefined : coords.top,
    bottom: coords.openUp ? window.innerHeight - coords.top : undefined,
    left: coords.left,
    width: MENU_WIDTH,
    zIndex: 9999,
  };

  const itemCls = "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left whitespace-nowrap";

  return createPortal(
    <div style={style}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: coords.openUp ? 4 : -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.12 }}
        className="rounded-xl border border-[#334155] bg-[#1a2639] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        <button onClick={() => { onClose(); onView(); }} className={cn(itemCls, "text-slate-200 hover:bg-white/8 hover:text-white")}>
          <Eye size={15} className="text-slate-400 flex-shrink-0" />
          View Details
        </button>
        <button onClick={() => { onClose(); onEdit(); }} className={cn(itemCls, "text-slate-200 hover:bg-white/8 hover:text-white")}>
          <Edit2 size={15} className="text-blue-400 flex-shrink-0" />
          Edit Booking
        </button>
        <button onClick={() => { onClose(); onReschedule(); }} className={cn(itemCls, "text-slate-200 hover:bg-white/8 hover:text-white")}>
          <Clock size={15} className="text-violet-400 flex-shrink-0" />
          Reschedule
        </button>
        <button onClick={() => { onClose(); onSync(); }} className={cn(itemCls, "text-slate-200 hover:bg-white/8 hover:text-white")}>
          <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
          Check Outlook Sync
        </button>
        <div className="h-px bg-[#334155] mx-3 my-1" />
        <button onClick={() => { onClose(); onDelete(); }} className={cn(itemCls, "text-rose-400 hover:bg-rose-500/10 hover:text-rose-300")}>
          <Trash2 size={15} className="flex-shrink-0" />
          Delete Booking
        </button>
      </motion.div>
    </div>,
    document.body
  );
}

// ── Booking Card ──────────────────────────────────────────────────────────────

function BookingCard({ booking, highlight, onView, onEdit, onDelete, onSync }: {
  booking: Booking;
  highlight?: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSync: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const TypeIcon = booking.type === "video" ? Video : booking.type === "call" ? Phone : MapPin;
  const isCancelled = booking.status === "cancelled";
  const name = clientLabel(booking.client);

  return (
    <div
      className={cn(
        "rounded-xl border p-4 flex items-start gap-3 transition-colors",
        "bg-riden-surface/60 backdrop-blur-sm",
        highlight && !isCancelled ? "border-blue-500/25 bg-blue-500/[0.04]" : "border-riden-border",
        isCancelled && "opacity-50"
      )}
    >
      {/* Time column */}
      <div className="text-center w-12 flex-shrink-0 pt-0.5">
        <div className="text-sm font-bold text-white tabular-nums">{booking.time.slice(0, 5)}</div>
        <div className="text-[10px] text-slate-500 mt-0.5">{booking.duration}</div>
      </div>

      {/* Divider */}
      <div className="w-px self-stretch bg-riden-border flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white truncate leading-snug">{booking.title}</div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <User size={10} className="flex-shrink-0" />
                <span className={cn("truncate max-w-[160px]", name === "No client linked" && "text-slate-600 italic")}>
                  {name}
                </span>
              </span>
              {booking.clientEmail && (
                <span className="text-slate-500 truncate max-w-[180px] hidden sm:inline">{booking.clientEmail}</span>
              )}
            </div>
          </div>

          {/* Status + menu trigger */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge
              variant={getStatusConfig(booking.status).variant}
              className="text-[10px] hidden sm:flex"
            >
              {getStatusConfig(booking.status).label}
            </Badge>
            <button
              ref={btnRef}
              onClick={() => setMenuOpen((v) => !v)}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0",
                "text-slate-500 hover:text-white hover:bg-white/10",
                menuOpen && "bg-white/10 text-white"
              )}
              aria-label="Booking actions"
            >
              <MoreHorizontal size={15} />
            </button>
          </div>
        </div>

        {/* Teams link */}
        {booking.teamsJoinUrl && !isCancelled && (
          <a
            href={booking.teamsJoinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Video size={11} /> Join Teams Meeting <ExternalLink size={10} />
          </a>
        )}

        {/* Footer metadata */}
        <div className="flex items-center flex-wrap gap-3 mt-2">
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <TypeIcon size={10} />
            {booking.type === "video" ? "Video Call" : booking.type === "call" ? "Phone Call" : "In Person"}
          </span>
          {booking.microsoftEventId && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <CheckCircle size={10} /> Outlook synced
            </span>
          )}
          {booking.notes && (
            <span className="text-[10px] text-slate-500 truncate max-w-[200px]" title={booking.notes}>
              {booking.notes}
            </span>
          )}
        </div>
      </div>

      {/* Portal menu — rendered outside DOM hierarchy, never clipped */}
      <AnimatePresence>
        {menuOpen && (
          <BookingActionMenu
            key="menu"
            btnRef={btnRef}
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            onView={onView}
            onEdit={onEdit}
            onReschedule={onEdit}
            onSync={onSync}
            onDelete={onDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Date Group Section ────────────────────────────────────────────────────────

function DateGroup({ dateStr, bookings, today, onView, onEdit, onDelete, onSync }: {
  dateStr: string;
  bookings: Booking[];
  today: string;
  onView: (b: Booking) => void;
  onEdit: (b: Booking) => void;
  onDelete: (id: string) => void;
  onSync: (b: Booking) => void;
}) {
  const sorted = [...bookings].sort((a, b) => a.time.localeCompare(b.time));
  const header = fmtGroupHeader(dateStr, today);
  const isToday = dateStr === today;

  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <span className={cn(
          "text-[11px] font-bold tracking-widest flex-shrink-0",
          isToday ? "text-blue-400" : "text-slate-500"
        )}>
          {header}
        </span>
        <div className="flex-1 h-px bg-riden-border" />
        <span className="text-[10px] text-slate-600 font-medium flex-shrink-0">
          {sorted.length} booking{sorted.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-2.5">
        {sorted.map((b) => (
          <BookingCard
            key={b.id}
            booking={b}
            highlight={isToday}
            onView={() => onView(b)}
            onEdit={() => onEdit(b)}
            onDelete={() => onDelete(b.id)}
            onSync={() => onSync(b)}
          />
        ))}
      </div>
    </section>
  );
}

// ── Month Grid ────────────────────────────────────────────────────────────────

function MonthGrid({ year, month, bookingsByDate, selectedDay, today, onDayClick, onPrev, onNext }: {
  year: number; month: number;
  bookingsByDate: Map<string, Booking[]>;
  selectedDay: string | null; today: string;
  onDayClick: (d: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const cells = getMonthCells(year, month);

  return (
    <div className="glass-card rounded-xl border border-riden-border p-3 sm:p-4">
      {/* Month header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-white">{MONTH_NAMES[month]} {year}</span>
        <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-400 hover:text-white transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-slate-600 uppercase py-1">{d}</div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell) => {
          const dayBookings = bookingsByDate.get(cell.dateStr) ?? [];
          const isToday = cell.dateStr === today;
          const isSelected = cell.dateStr === selectedDay;

          return (
            <button
              key={cell.dateStr}
              onClick={() => onDayClick(cell.dateStr)}
              className={cn(
                "min-h-[44px] sm:min-h-[68px] rounded-lg p-1 flex flex-col transition-all duration-150 focus:outline-none",
                !cell.cur && "opacity-25 pointer-events-none",
                isSelected
                  ? "ring-2 ring-blue-500 bg-blue-500/10"
                  : isToday
                    ? "bg-blue-500/10 ring-1 ring-blue-500/20 hover:bg-blue-500/15"
                    : "hover:bg-riden-muted/80"
              )}
            >
              <span
                className={cn(
                  "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-semibold self-end transition-colors",
                  isSelected
                    ? "bg-blue-600 text-white"
                    : isToday
                      ? "bg-blue-500 text-white"
                      : cell.cur
                        ? "text-slate-300"
                        : "text-slate-600"
                )}
              >
                {cell.day}
              </span>

              {dayBookings.length > 0 && (
                <div className="mt-0.5 w-full flex-1 space-y-0.5 overflow-hidden">
                  {dayBookings.slice(0, 2).map((b) => {
                    const cfg = getStatusConfig(b.status);
                    const isActive = b.status === "approved" || b.status === "confirmed";
                    return (
                      <div
                        key={b.id}
                        className={cn(
                          "hidden sm:block text-[9px] truncate px-1 rounded leading-[14px]",
                          isActive
                            ? "bg-blue-500/20 text-blue-300"
                            : b.status === "awaiting_response" || b.status === "tentative" || b.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-300"
                              : b.status === "declined"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-slate-600/30 text-slate-400"
                        )}
                      >
                        {b.title.replace("Riden Technologies ", "RT ")}
                      </div>
                    );
                  })}
                  {dayBookings.length > 2 && (
                    <div className="hidden sm:block text-[9px] text-slate-500 px-1">
                      +{dayBookings.length - 2} more
                    </div>
                  )}
                  <div className="sm:hidden flex gap-0.5 px-0.5 mt-1">
                    {dayBookings.slice(0, 3).map((b) => (
                      <div key={b.id} className={cn("w-1.5 h-1.5 rounded-full", getStatusConfig(b.status).calDot)} />
                    ))}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [view, setView] = useState<ViewMode>("month");
  const [calDate, setCalDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);

  const today = todayStr();

  useEffect(() => {
    if (window.innerWidth < 640) setView("agenda");
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const bookingsByDate = useMemo(() => {
    const m = new Map<string, Booking[]>();
    for (const b of bookings) {
      if (!m.has(b.date)) m.set(b.date, []);
      m.get(b.date)!.push(b);
    }
    return m;
  }, [bookings]);

  // Selected day bookings — shows all bookings for that date (past or future)
  const selectedDayBookings = useMemo(
    () => selectedDay
      ? [...(bookingsByDate.get(selectedDay) ?? [])].sort((a, b) => a.time.localeCompare(b.time))
      : [],
    [bookingsByDate, selectedDay]
  );

  // Upcoming grouped by date — today + future, sorted
  const upcomingGrouped = useMemo(() => {
    const sorted = bookings
      .filter((b) => b.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    const groups = new Map<string, Booking[]>();
    for (const b of sorted) {
      if (!groups.has(b.date)) groups.set(b.date, []);
      groups.get(b.date)!.push(b);
    }
    return groups;
  }, [bookings, today]);

  // Past bookings — newest first, capped at 5
  const pastBookings = useMemo(
    () => bookings
      .filter((b) => b.date < today)
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
      .slice(0, 5),
    [bookings, today]
  );

  const totalToday = useMemo(
    () => bookings.filter((b) => b.date === today && b.status !== "cancelled").length,
    [bookings, today]
  );

  function showToast(message: string, ok: boolean) {
    setToast({ message, ok });
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/bookings/sync-outlook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Synced ${data.synced} events · ${data.created} new · ${data.updated} updated`, true);
        setLastSynced(new Date());
        fetchBookings();
      } else {
        showToast(data.error ?? "Sync failed", false);
      }
    } catch {
      showToast("Sync failed — network error", false);
    } finally {
      setSyncing(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/bookings/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Booking deleted", true);
        fetchBookings();
      } else {
        showToast("Failed to delete booking", false);
      }
    } catch {
      showToast("Failed to delete booking", false);
    } finally {
      setDeleteId(null);
    }
  }

  function goPrevMonth() {
    setCalDate((d) => d.month === 0 ? { year: d.year - 1, month: 11 } : { ...d, month: d.month - 1 });
    setSelectedDay(null);
  }

  function goNextMonth() {
    setCalDate((d) => d.month === 11 ? { year: d.year + 1, month: 0 } : { ...d, month: d.month + 1 });
    setSelectedDay(null);
  }

  function handleDayClick(dateStr: string) {
    setSelectedDay(dateStr);
  }

  function openEdit(b: Booking) {
    setEditBooking(b);
    setModalOpen(true);
  }

  function handleSyncBooking(b: Booking) {
    if (b.microsoftEventId) {
      showToast(`Outlook synced · Event ID: ${b.microsoftEventId.slice(0, 12)}…`, true);
    } else {
      showToast("This booking is not linked to an Outlook calendar event.", false);
    }
  }

  const deleteBooking = bookings.find((b) => b.id === deleteId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">Bookings & Calendar</h2>
          <div className="flex items-center gap-2 flex-wrap text-sm text-slate-500">
            <span>{totalToday} appointment{totalToday !== 1 ? "s" : ""} today</span>
            {lastSynced && (
              <>
                <span className="text-slate-700">·</span>
                <span className="flex items-center gap-1">
                  <CheckCircle size={11} className="text-emerald-500" />
                  Synced {fmtRelative(lastSynced)}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} title="Sync from Outlook calendar">
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Sync Outlook</span>
          </Button>

          <div className="hidden sm:flex bg-riden-muted rounded-lg p-1 border border-riden-border gap-0.5">
            {(["month", "agenda"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize",
                  view === v ? "bg-riden-surface text-white shadow-sm" : "text-slate-500 hover:text-white"
                )}
              >
                {v === "month"
                  ? <span className="flex items-center gap-1.5"><Calendar size={12} />{v}</span>
                  : <span className="flex items-center gap-1.5"><Clock size={12} />{v}</span>
                }
              </button>
            ))}
          </div>

          <Button variant="gradient" size="sm" onClick={() => { setEditBooking(null); setModalOpen(true); }}>
            <Plus size={14} />
            <span className="hidden sm:inline">New Booking</span>
          </Button>
        </div>
      </div>

      {/* Month calendar */}
      {view === "month" && (
        <MonthGrid
          year={calDate.year}
          month={calDate.month}
          bookingsByDate={bookingsByDate}
          selectedDay={selectedDay}
          today={today}
          onDayClick={handleDayClick}
          onPrev={goPrevMonth}
          onNext={goNextMonth}
        />
      )}

      {/* Selected day panel */}
      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-blue-500/25 p-4"
          style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.06), transparent)" }}
        >
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-blue-400 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-white">
                Bookings for {fmtDateLong(selectedDay)}
              </h3>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors"
            >
              <X size={11} /> Clear
            </button>
          </div>

          {selectedDayBookings.length === 0 ? (
            <div className="py-6 text-center">
              <Calendar size={24} className="text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No bookings for this day</p>
              <button
                onClick={() => { setEditBooking(null); setModalOpen(true); }}
                className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                + Add a booking for this day
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {selectedDayBookings.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  highlight={selectedDay === today}
                  onView={() => setViewBooking(b)}
                  onEdit={() => openEdit(b)}
                  onDelete={() => setDeleteId(b.id)}
                  onSync={() => handleSyncBooking(b)}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Upcoming — grouped by date */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass-card rounded-xl border border-riden-border p-4 animate-pulse flex gap-4">
              <div className="w-12 h-10 rounded bg-riden-muted" />
              <div className="w-px h-10 bg-riden-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-riden-muted" />
                <div className="h-3 w-32 rounded bg-riden-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : upcomingGrouped.size === 0 ? (
        <div className="glass-card rounded-xl border border-riden-border p-12 text-center">
          <Calendar size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No upcoming bookings</p>
          <p className="text-sm text-slate-500 mb-5">Create a booking or sync from Outlook to get started.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button variant="gradient" size="sm" onClick={() => { setEditBooking(null); setModalOpen(true); }}>
              <Plus size={14} /> New Booking
            </Button>
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} /> Sync Outlook
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(upcomingGrouped.entries()).map(([dateStr, dayBookings]) => (
            <DateGroup
              key={dateStr}
              dateStr={dateStr}
              bookings={dayBookings}
              today={today}
              onView={(b) => setViewBooking(b)}
              onEdit={(b) => openEdit(b)}
              onDelete={(id) => setDeleteId(id)}
              onSync={(b) => handleSyncBooking(b)}
            />
          ))}
        </div>
      )}

      {/* Past bookings */}
      {!loading && pastBookings.length > 0 && (
        <section className="opacity-60">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] font-bold tracking-widest text-slate-600">PAST BOOKINGS</span>
            <div className="flex-1 h-px bg-riden-border" />
            <span className="text-[10px] text-slate-600">{pastBookings.length} shown</span>
          </div>
          <div className="space-y-2.5">
            {pastBookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onView={() => setViewBooking(b)}
                onEdit={() => openEdit(b)}
                onDelete={() => setDeleteId(b.id)}
                onSync={() => handleSyncBooking(b)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Modals */}
      <BookingDetailModal
        booking={viewBooking}
        onClose={() => setViewBooking(null)}
        onEdit={() => { if (viewBooking) openEdit(viewBooking); }}
        onDelete={() => { if (viewBooking) setDeleteId(viewBooking.id); }}
      />

      <BookingModal
        open={modalOpen}
        mode={editBooking ? "edit" : "create"}
        initial={editBooking}
        defaultDate={editBooking ? undefined : selectedDay}
        onClose={() => { setModalOpen(false); setEditBooking(null); }}
        onSave={(graphError, emailError, emailSent) => {
          fetchBookings();
          if (graphError) {
            showToast(`Saved — but Teams error: ${graphError.slice(0, 60)}`, false);
          } else if (emailError) {
            showToast(`Booking saved — email not sent: ${emailError.slice(0, 80)}`, false);
          } else if (emailSent) {
            showToast(editBooking ? "Booking updated" : "Booking created — confirmation email sent", true);
          } else {
            showToast(editBooking ? "Booking updated" : "Booking created", true);
          }
        }}
      />

      <DeleteModal
        open={!!deleteId}
        title={deleteBooking?.title ?? ""}
        hasOutlook={!!deleteBooking?.microsoftEventId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
      />

      <AnimatePresence>
        {toast && (
          <Toast key={toast.message} message={toast.message} ok={toast.ok} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
