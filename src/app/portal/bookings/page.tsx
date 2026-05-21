"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, Plus, Video, User, MoreHorizontal, X,
  Phone, RefreshCw, Trash2, Edit2, CheckCircle, ChevronLeft,
  ChevronRight, ExternalLink, AlertCircle, MapPin,
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

const STATUS_COLORS = {
  confirmed: "success",
  pending: "warning",
  cancelled: "secondary",
} as const;

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

function fmtDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function fmtRelative(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function defaultForm(): BookingForm {
  return {
    title: "Riden Technologies Strategy Call",
    client: "",
    clientEmail: "",
    date: todayStr(),
    time: "10:00",
    duration: "30 min",
    durationMinutes: 30,
    type: "video",
    status: "confirmed",
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
    cells.push({
      dateStr: `${py}-${String(pm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      day: d, cur: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      day: d, cur: true,
    });
  }
  let nd = 1;
  while (cells.length % 7 !== 0) {
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    cells.push({
      dateStr: `${ny}-${String(nm + 1).padStart(2, "0")}-${String(nd).padStart(2, "0")}`,
      day: nd++, cur: false,
    });
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

// ── Booking Modal ─────────────────────────────────────────────────────────────

function BookingModal({ open, mode, initial, onClose, onSave }: {
  open: boolean;
  mode: "create" | "edit";
  initial?: Booking | null;
  onClose: () => void;
  onSave: (graphError?: string | null) => void;
}) {
  const [form, setForm] = useState<BookingForm>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initial ? bookingToForm(initial) : defaultForm());
      setError("");
    }
  }, [open, initial]);

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
      const url =
        mode === "edit" && initial?.id ? `/api/bookings/${initial.id}` : "/api/bookings";
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
      onSave(data.graphError ?? null);
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
            {/* Mobile handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-riden-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-riden-border flex-shrink-0">
              <h2 className="text-base font-semibold text-white">
                {mode === "create" ? "New Booking" : "Edit Booking"}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4 overflow-y-auto portal-scroll flex-1">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Meeting Title</label>
                <input
                  className={inputCls}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Client Name</label>
                  <input
                    className={inputCls}
                    placeholder="John Smith"
                    value={form.client}
                    onChange={(e) => set("client", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Client Email</label>
                  <input
                    type="email"
                    className={inputCls}
                    placeholder="john@company.com"
                    value={form.clientEmail}
                    onChange={(e) => set("clientEmail", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Date</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.date}
                    onChange={(e) => set("date", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Time</label>
                  <input
                    type="time"
                    className={inputCls}
                    value={form.time}
                    onChange={(e) => set("time", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Duration</label>
                  <select
                    className={inputCls}
                    value={form.duration}
                    onChange={(e) => handleDurationChange(e.target.value)}
                  >
                    {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Meeting Type</label>
                  <select
                    className={inputCls}
                    value={form.type}
                    onChange={(e) => set("type", e.target.value)}
                  >
                    <option value="video">Video Call</option>
                    <option value="call">Phone Call</option>
                    <option value="in-person">In Person</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Status</label>
                <select
                  className={inputCls}
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
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
                <textarea
                  className={inputCls + " resize-none"}
                  rows={3}
                  placeholder="Any extra details..."
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2.5">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-5 py-4 border-t border-riden-border flex-shrink-0">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
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

// ── Booking Card ──────────────────────────────────────────────────────────────

function BookingCard({ booking, onEdit, onDelete, highlight }: {
  booking: Booking;
  onEdit: () => void;
  onDelete: () => void;
  highlight?: boolean;
}) {
  const [menu, setMenu] = useState(false);
  const TypeIcon = booking.type === "video" ? Video : booking.type === "call" ? Phone : MapPin;
  const isCancelled = booking.status === "cancelled";

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "glass-card rounded-xl border p-4 flex items-start gap-3 relative",
        highlight && !isCancelled ? "border-blue-500/20" : "border-riden-border",
        isCancelled && "opacity-60"
      )}
      style={
        highlight && !isCancelled
          ? { background: "linear-gradient(135deg, rgba(59,130,246,0.05), transparent)" }
          : undefined
      }
    >
      {/* Time column */}
      <div className="text-center w-12 flex-shrink-0 pt-0.5">
        <div className="text-sm font-bold text-white">{booking.time.slice(0, 5)}</div>
        <div className="text-[10px] text-slate-500">{booking.duration}</div>
      </div>

      {/* Divider */}
      <div className="w-px self-stretch bg-riden-border flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white truncate">{booking.title}</div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <User size={10} /> {booking.client}
              </span>
              {booking.clientEmail && (
                <span className="text-slate-500 truncate max-w-[180px]">{booking.clientEmail}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
            <Badge
              variant={STATUS_COLORS[booking.status as keyof typeof STATUS_COLORS] ?? "secondary"}
              className="text-[10px] hidden sm:flex"
            >
              {booking.status}
            </Badge>
            <div className="relative">
              <button
                onClick={() => setMenu(!menu)}
                className="p-1.5 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors"
              >
                <MoreHorizontal size={14} />
              </button>
              {menu && (
                <div
                  className="absolute right-0 top-full mt-1 w-36 bg-riden-surface rounded-xl border border-riden-border overflow-hidden z-20 shadow-2xl"
                  onClick={() => setMenu(false)}
                >
                  <button
                    onClick={onEdit}
                    className="w-full flex items-center gap-2 px-3 py-3 text-xs text-white hover:bg-riden-muted transition-colors font-medium"
                  >
                    <Edit2 size={13} className="text-blue-400" /> Edit
                  </button>
                  <div className="h-px bg-riden-border mx-2" />
                  <button
                    onClick={onDelete}
                    className="w-full flex items-center gap-2 px-3 py-3 text-xs text-rose-400 hover:bg-riden-muted transition-colors font-medium"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Teams join link */}
        {booking.teamsJoinUrl && !isCancelled && (
          <a
            href={booking.teamsJoinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Video size={11} /> Join Teams Meeting
            <ExternalLink size={10} />
          </a>
        )}

        {/* Footer row */}
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
            <span className="text-[10px] text-slate-500 truncate max-w-[160px]" title={booking.notes ?? ""}>
              {booking.notes}
            </span>
          )}
        </div>
      </div>
    </motion.div>
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
        <button
          onClick={onPrev}
          className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-white">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={onNext}
          className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-400 hover:text-white transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-slate-600 uppercase py-1">
            {d}
          </div>
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
                "min-h-[44px] sm:min-h-[68px] rounded-lg p-1 flex flex-col transition-all duration-150 hover:bg-riden-muted",
                !cell.cur && "opacity-25 pointer-events-none",
                isToday && "bg-blue-500/10 ring-1 ring-blue-500/30",
                isSelected && !isToday && "ring-1 ring-riden-border bg-riden-muted/60",
              )}
            >
              <span
                className={cn(
                  "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-medium self-end",
                  isToday ? "bg-blue-500 text-white" : cell.cur ? "text-slate-300" : "text-slate-600"
                )}
              >
                {cell.day}
              </span>

              {dayBookings.length > 0 && (
                <div className="mt-0.5 w-full flex-1 space-y-0.5 overflow-hidden">
                  {/* Text pills — desktop only */}
                  {dayBookings.slice(0, 2).map((b) => (
                    <div
                      key={b.id}
                      className={cn(
                        "hidden sm:block text-[9px] truncate px-1 rounded leading-[14px]",
                        b.status === "confirmed"
                          ? "bg-blue-500/20 text-blue-300"
                          : b.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-slate-600/30 text-slate-400"
                      )}
                    >
                      {b.title.replace("Riden Technologies ", "RT ")}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div className="hidden sm:block text-[9px] text-slate-500 px-1">
                      +{dayBookings.length - 2} more
                    </div>
                  )}
                  {/* Dot indicators — mobile only */}
                  <div className="sm:hidden flex gap-0.5 px-0.5 mt-1">
                    {dayBookings.slice(0, 3).map((b) => (
                      <div
                        key={b.id}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          b.status === "confirmed"
                            ? "bg-blue-400"
                            : b.status === "pending"
                            ? "bg-yellow-400"
                            : "bg-slate-500"
                        )}
                      />
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

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const bookingsByDate = useMemo(() => {
    const m = new Map<string, Booking[]>();
    for (const b of bookings) {
      if (!m.has(b.date)) m.set(b.date, []);
      m.get(b.date)!.push(b);
    }
    return m;
  }, [bookings]);

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
        showToast(
          `Synced ${data.synced} events · ${data.created} new · ${data.updated} updated`,
          true
        );
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
    setCalDate((d) =>
      d.month === 0 ? { year: d.year - 1, month: 11 } : { ...d, month: d.month - 1 }
    );
    setSelectedDay(null);
  }

  function goNextMonth() {
    setCalDate((d) =>
      d.month === 11 ? { year: d.year + 1, month: 0 } : { ...d, month: d.month + 1 }
    );
    setSelectedDay(null);
  }

  function handleDayClick(dateStr: string) {
    setSelectedDay((prev) => (prev === dateStr ? null : dateStr));
  }

  const agendaBookings = useMemo(
    () => (selectedDay ? bookings.filter((b) => b.date === selectedDay) : bookings),
    [bookings, selectedDay]
  );

  const grouped = useMemo(
    () => ({
      today: agendaBookings.filter((b) => b.date === today),
      upcoming: agendaBookings.filter((b) => b.date > today),
      past: agendaBookings.filter((b) => b.date < today),
    }),
    [agendaBookings, today]
  );

  const totalToday = useMemo(
    () => bookings.filter((b) => b.date === today && b.status !== "cancelled").length,
    [bookings, today]
  );

  const deleteBooking = bookings.find((b) => b.id === deleteId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">Bookings & Calendar</h2>
          <div className="flex items-center gap-2 flex-wrap text-sm text-slate-500">
            <span>
              {totalToday} appointment{totalToday !== 1 ? "s" : ""} today
            </span>
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            title="Sync from Outlook calendar"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Sync Outlook</span>
          </Button>

          {/* View toggle — desktop only */}
          <div className="hidden sm:flex bg-riden-muted rounded-lg p-1 border border-riden-border gap-0.5">
            {(["month", "agenda"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize",
                  view === v
                    ? "bg-riden-surface text-white shadow-sm"
                    : "text-slate-500 hover:text-white"
                )}
              >
                {v === "month" ? (
                  <span className="flex items-center gap-1.5"><Calendar size={12} />{v}</span>
                ) : (
                  <span className="flex items-center gap-1.5"><Clock size={12} />{v}</span>
                )}
              </button>
            ))}
          </div>

          <Button
            variant="gradient"
            size="sm"
            onClick={() => { setEditBooking(null); setModalOpen(true); }}
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Booking</span>
          </Button>
        </div>
      </div>

      {/* Month Grid */}
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

      {/* Selected day label */}
      {selectedDay && (
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-blue-400" />
          <span className="text-sm font-semibold text-white">{fmtDate(selectedDay)}</span>
          <button
            onClick={() => setSelectedDay(null)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors ml-1"
          >
            <X size={11} /> Clear filter
          </button>
        </div>
      )}

      {/* Agenda / List */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="glass-card rounded-xl border border-riden-border p-4 animate-pulse flex gap-4"
            >
              <div className="w-12 h-10 rounded bg-riden-muted" />
              <div className="w-px h-10 bg-riden-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-riden-muted" />
                <div className="h-3 w-32 rounded bg-riden-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : agendaBookings.length === 0 ? (
        <div className="glass-card rounded-xl border border-riden-border p-12 text-center">
          <Calendar size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">
            {selectedDay ? "No bookings for this day" : "No bookings yet"}
          </p>
          <p className="text-sm text-slate-500 mb-5">
            {selectedDay
              ? "Click another day or clear the filter."
              : "Create your first booking or sync from the Outlook calendar."}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              variant="gradient"
              size="sm"
              onClick={() => { setEditBooking(null); setModalOpen(true); }}
            >
              <Plus size={14} /> New Booking
            </Button>
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              Sync Outlook
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.today.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                Today — {fmtDate(today)}
              </h3>
              <div className="space-y-3">
                {grouped.today.map((b) => (
                  <BookingCard
                    key={b.id} booking={b} highlight
                    onEdit={() => { setEditBooking(b); setModalOpen(true); }}
                    onDelete={() => setDeleteId(b.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {grouped.upcoming.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                Upcoming
              </h3>
              <div className="space-y-3">
                {grouped.upcoming.map((b) => (
                  <BookingCard
                    key={b.id} booking={b}
                    onEdit={() => { setEditBooking(b); setModalOpen(true); }}
                    onDelete={() => setDeleteId(b.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {grouped.past.length > 0 && !selectedDay && (
            <section className="opacity-60">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                Past
              </h3>
              <div className="space-y-3">
                {grouped.past.slice(0, 5).map((b) => (
                  <BookingCard
                    key={b.id} booking={b}
                    onEdit={() => { setEditBooking(b); setModalOpen(true); }}
                    onDelete={() => setDeleteId(b.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Modals */}
      <BookingModal
        open={modalOpen}
        mode={editBooking ? "edit" : "create"}
        initial={editBooking}
        onClose={() => { setModalOpen(false); setEditBooking(null); }}
        onSave={(graphError) => {
          fetchBookings();
          if (graphError) {
            showToast(`Saved — but Teams error: ${graphError.slice(0, 60)}`, false);
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

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast
            key={toast.message}
            message={toast.message}
            ok={toast.ok}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
