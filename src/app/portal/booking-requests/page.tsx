"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scissors, Clock, Phone, Mail, Calendar, ChevronDown,
  Check, X, Trash2, StickyNote, RefreshCw, Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingRequest = {
  id: string;
  siteId: string | null;
  businessName: string;
  customerName: string;
  phone: string;
  email: string;
  treatment: string;
  preferredDate: string;
  preferredTime: string;
  specialRequests: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type StatusKey = "pending" | "confirmed" | "cancelled" | "no_show" | "completed";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<StatusKey, { label: string; variant: "warning" | "success" | "destructive" | "secondary" | "violet" }> = {
  pending:   { label: "Pending",   variant: "warning"     },
  confirmed: { label: "Confirmed", variant: "success"     },
  cancelled: { label: "Cancelled", variant: "destructive" },
  no_show:   { label: "No Show",   variant: "secondary"   },
  completed: { label: "Completed", variant: "violet"      },
};

const STATUS_ACTIONS: { key: StatusKey; label: string }[] = [
  { key: "confirmed", label: "Confirm" },
  { key: "cancelled", label: "Cancel"  },
  { key: "completed", label: "Complete" },
  { key: "no_show",   label: "No Show" },
  { key: "pending",   label: "Reset to Pending" },
];

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as StatusKey] ?? { label: status, variant: "secondary" as const };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return iso; }
}

function fmtDateLong(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch { return dateStr; }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BookingRequestsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selected, setSelected] = useState<BookingRequest | null>(null);
  const [notesEdit, setNotesEdit] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterStatus === "all"
        ? "/api/booking-requests"
        : `/api/booking-requests?status=${filterStatus}`;
      const res = await fetch(url);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetch_(); }, [fetch_]);

  async function updateStatus(id: string, status: string) {
    setSaving(true);
    try {
      await fetch(`/api/booking-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
    } finally {
      setSaving(false);
      setStatusMenuId(null);
    }
  }

  async function saveNotes(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/booking-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesEdit }),
      });
      const updated = await res.json();
      setRequests(prev => prev.map(r => r.id === id ? updated : r));
      if (selected?.id === id) setSelected(updated);
    } finally {
      setSaving(false);
    }
  }

  async function deleteRequest(id: string) {
    if (!confirm("Delete this booking request?")) return;
    await fetch(`/api/booking-requests/${id}`, { method: "DELETE" });
    setRequests(prev => prev.filter(r => r.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function openDetail(r: BookingRequest) {
    setSelected(r);
    setNotesEdit(r.notes ?? "");
  }

  const filtered = filterStatus === "all"
    ? requests
    : requests.filter(r => r.status === filterStatus);

  const pendingCount = requests.filter(r => r.status === "pending").length;

  const card = isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200";
  const text = isDark ? "text-slate-100" : "text-slate-900";
  const muted = isDark ? "text-slate-400" : "text-slate-500";
  const divider = isDark ? "border-slate-700" : "border-slate-200";
  const inputCls = isDark
    ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400";

  return (
    <div className={cn("flex-1 min-h-screen p-6 lg:p-8", isDark ? "bg-slate-900" : "bg-slate-50")}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Scissors className="text-pink-500" size={22} />
            <h1 className={cn("text-2xl font-bold", text)}>Booking Requests</h1>
            {pendingCount > 0 && (
              <span className="bg-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingCount} new
              </span>
            )}
          </div>
          <p className={cn("text-sm", muted)}>Appointment requests from your beauty clients&apos; websites</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetch_} className="gap-2">
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter size={14} className={muted} />
        {["all", "pending", "confirmed", "completed", "cancelled", "no_show"].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
              filterStatus === s
                ? "bg-pink-500 text-white"
                : isDark
                  ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {s === "all" ? "All" : STATUS_CONFIG[s as StatusKey]?.label ?? s}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* List */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className={cn("text-center py-20", muted)}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div className={cn("text-center py-20", muted)}>
              <Scissors size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No booking requests yet</p>
              <p className="text-sm mt-1">They&apos;ll appear here when clients submit the form on the beauty site.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(r => {
                const sc = getStatusConfig(r.status);
                const isSelected = selected?.id === r.id;
                return (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "rounded-xl border p-4 cursor-pointer transition-all",
                      card,
                      isSelected
                        ? "ring-2 ring-pink-500"
                        : isDark ? "hover:border-slate-500" : "hover:border-slate-300"
                    )}
                    onClick={() => openDetail(r)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("font-semibold text-sm", text)}>{r.customerName}</span>
                          <Badge variant={sc.variant as "warning" | "success" | "destructive" | "secondary" | "violet" | "default"}>{sc.label}</Badge>
                        </div>

                        <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs", muted)}>
                          {r.businessName && (
                            <span className="flex items-center gap-1">
                              <Scissors size={11} />
                              {r.businessName}
                            </span>
                          )}
                          {r.treatment && (
                            <span className="flex items-center gap-1">
                              <Scissors size={11} />
                              {r.treatment}
                            </span>
                          )}
                          {r.preferredDate && (
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {fmtDateLong(r.preferredDate)}
                            </span>
                          )}
                          {r.preferredTime && (
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {r.preferredTime}
                            </span>
                          )}
                          {r.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={11} />
                              {r.phone}
                            </span>
                          )}
                          {r.email && (
                            <span className="flex items-center gap-1">
                              <Mail size={11} />
                              {r.email}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Quick status actions */}
                        <div className="relative">
                          <button
                            className={cn(
                              "flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors",
                              isDark
                                ? "border-slate-600 text-slate-300 hover:border-slate-400"
                                : "border-slate-200 text-slate-600 hover:border-slate-400"
                            )}
                            onClick={e => { e.stopPropagation(); setStatusMenuId(statusMenuId === r.id ? null : r.id); }}
                          >
                            Status <ChevronDown size={11} />
                          </button>
                          <AnimatePresence>
                            {statusMenuId === r.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                className={cn(
                                  "absolute right-0 top-full mt-1 z-50 rounded-xl border shadow-xl min-w-[160px] py-1",
                                  isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                                )}
                                onClick={e => e.stopPropagation()}
                              >
                                {STATUS_ACTIONS.map(a => (
                                  <button
                                    key={a.key}
                                    className={cn(
                                      "w-full text-left px-4 py-2 text-xs font-medium transition-colors flex items-center gap-2",
                                      r.status === a.key
                                        ? "text-pink-500"
                                        : isDark ? "text-slate-300 hover:bg-slate-700" : "text-slate-700 hover:bg-slate-50"
                                    )}
                                    onClick={() => updateStatus(r.id, a.key)}
                                  >
                                    {r.status === a.key && <Check size={11} />}
                                    {a.label}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <span className={cn("text-xs hidden sm:block", muted)}>{fmtDate(r.createdAt)}</span>
                      </div>
                    </div>

                    {r.specialRequests && (
                      <p className={cn("text-xs mt-2 pl-0 italic", muted)}>
                        &quot;{r.specialRequests}&quot;
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.aside
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 32 }}
              className={cn(
                "w-80 shrink-0 rounded-2xl border p-5 self-start sticky top-8",
                card
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={cn("font-bold text-sm", text)}>Request Detail</h3>
                <button onClick={() => setSelected(null)} className={muted}>
                  <X size={16} />
                </button>
              </div>

              <div className={cn("space-y-3 mb-5 text-sm", text)}>
                {[
                  ["Customer",       selected.customerName],
                  ["Email",          selected.email        || "—"],
                  ["Phone",          selected.phone        || "—"],
                  ["Treatment",      selected.treatment    || "—"],
                  ["Preferred Date", fmtDateLong(selected.preferredDate)],
                  ["Preferred Time", selected.preferredTime || "—"],
                  ["Business",       selected.businessName  || "—"],
                  ["Received",       fmtDate(selected.createdAt)],
                ].map(([label, value]) => (
                  <div key={label} className={cn("flex flex-col gap-0.5 pb-3 border-b last:border-0", divider)}>
                    <span className={cn("text-xs font-semibold uppercase tracking-wide", muted)}>{label}</span>
                    <span>{value}</span>
                  </div>
                ))}

                {selected.specialRequests && (
                  <div className={cn("flex flex-col gap-0.5 pb-3 border-b", divider)}>
                    <span className={cn("text-xs font-semibold uppercase tracking-wide", muted)}>Special Requests</span>
                    <span className="italic">{selected.specialRequests}</span>
                  </div>
                )}
              </div>

              {/* Status actions */}
              <div className="mb-5">
                <p className={cn("text-xs font-semibold uppercase tracking-wide mb-2", muted)}>Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_ACTIONS.map(a => (
                    <button
                      key={a.key}
                      disabled={saving}
                      onClick={() => updateStatus(selected.id, a.key)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-semibold border transition-colors",
                        selected.status === a.key
                          ? "bg-pink-500 border-pink-500 text-white"
                          : isDark
                            ? "border-slate-600 text-slate-300 hover:border-pink-500 hover:text-pink-400"
                            : "border-slate-200 text-slate-600 hover:border-pink-500 hover:text-pink-600"
                      )}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-5">
                <label className={cn("flex items-center gap-1 text-xs font-semibold uppercase tracking-wide mb-2", muted)}>
                  <StickyNote size={11} /> Notes
                </label>
                <textarea
                  rows={4}
                  value={notesEdit}
                  onChange={e => setNotesEdit(e.target.value)}
                  placeholder="Internal notes..."
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500",
                    inputCls
                  )}
                />
                <Button
                  size="sm"
                  disabled={saving}
                  onClick={() => saveNotes(selected.id)}
                  className="mt-2 w-full bg-pink-500 hover:bg-pink-600 text-white"
                >
                  Save Notes
                </Button>
              </div>

              {/* Delete */}
              <button
                onClick={() => deleteRequest(selected.id)}
                className={cn(
                  "flex items-center gap-2 text-xs font-medium transition-colors",
                  isDark ? "text-red-400 hover:text-red-300" : "text-red-500 hover:text-red-700"
                )}
              >
                <Trash2 size={13} /> Delete request
              </button>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
