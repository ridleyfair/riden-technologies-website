"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, Plus, Video, User, MoreHorizontal, X,
  Phone, RefreshCw, Trash2, Edit2, CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

type Booking = {
  id: string; title: string; client: string; date: string; time: string;
  duration: string; type: string; status: string; notes?: string; createdAt: string;
};

const STATUS_COLORS = {
  confirmed: "success",
  pending: "warning",
  cancelled: "secondary",
} as const;

const DURATIONS = ["15 min", "30 min", "45 min", "60 min", "90 min"];
const TYPES = ["video", "call", "in-person"];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function groupBookings(bookings: Booking[]) {
  const today = todayStr();
  return {
    today: bookings.filter((b) => b.date === today),
    upcoming: bookings.filter((b) => b.date > today),
    past: bookings.filter((b) => b.date < today),
  };
}

const inputCls = "w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors";

type BookingForm = {
  title: string; client: string; date: string; time: string;
  duration: string; type: string; status: string; notes: string;
};

function defaultForm(): BookingForm {
  return { title: "", client: "", date: todayStr(), time: "10:00", duration: "30 min", type: "video", status: "confirmed", notes: "" };
}

function BookingModal({
  open, mode, initial, onClose, onSave,
}: {
  open: boolean; mode: "create" | "edit"; initial?: Partial<BookingForm> & { id?: string };
  onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState<BookingForm>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...defaultForm(), ...initial } : defaultForm());
      setError("");
    }
  }, [open, initial]);

  function set(field: keyof BookingForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!form.title || !form.client || !form.date || !form.time) {
      setError("Title, client, date and time are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = mode === "edit" && initial?.id ? `/api/bookings/${initial.id}` : "/api/bookings";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to save."); return; }
      onSave();
      onClose();
    } catch { setError("Network error."); } finally { setSaving(false); }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }} transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg glass-card rounded-2xl border border-riden-border"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-riden-border">
              <h2 className="text-base font-semibold text-white">{mode === "create" ? "New Booking" : "Edit Booking"}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto portal-scroll">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Meeting Title</label>
                <input className={inputCls} placeholder="e.g. Strategy Call — Acme Corp" value={form.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Client / Guest</label>
                <input className={inputCls} placeholder="Client name" value={form.client} onChange={(e) => set("client", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Date</label>
                  <input type="date" className={inputCls} value={form.date} onChange={(e) => set("date", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Time</label>
                  <input type="time" className={inputCls} value={form.time} onChange={(e) => set("time", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Duration</label>
                  <select className={inputCls} value={form.duration} onChange={(e) => set("duration", e.target.value)}>
                    {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Type</label>
                  <select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value)}>
                    {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Status</label>
                <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
                <textarea className={inputCls + " resize-none"} rows={3} placeholder="Any extra details..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
              </div>
              {error && <p className="text-xs text-rose-400">{error}</p>}
            </div>
            <div className="flex gap-3 px-5 py-4 border-t border-riden-border">
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

function BookingCard({ booking, onEdit, onDelete, isToday }: { booking: Booking; onEdit: () => void; onDelete: () => void; isToday?: boolean }) {
  const [menu, setMenu] = useState(false);
  const TypeIcon = booking.type === "video" ? Video : booking.type === "call" ? Phone : User;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`glass-card rounded-xl border p-4 flex items-center gap-4 relative ${isToday ? "border-blue-500/20" : "border-riden-border"}`}
      style={isToday ? { background: "linear-gradient(135deg, rgba(59,130,246,0.06), transparent)" } : undefined}
    >
      <div className="text-center w-14 flex-shrink-0">
        <div className="text-lg font-bold text-white">{booking.time.split(":")[0]}</div>
        <div className="text-xs text-slate-500">{booking.time.split(":")[1] ? `:${booking.time.split(":")[1]}` : ""}</div>
      </div>
      <div className="w-px h-10 bg-riden-border flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{booking.title}</div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
          <User size={11} /><span className="truncate">{booking.client}</span>
          <span>·</span><Clock size={11} /><span>{booking.duration}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant={STATUS_COLORS[booking.status as keyof typeof STATUS_COLORS] ?? "secondary"} className="text-[10px] hidden sm:flex">
          {booking.status}
        </Badge>
        {booking.status !== "cancelled" && (
          <Button variant="default" size="sm" className="text-xs hidden sm:flex">
            <TypeIcon size={12} /> {booking.type === "video" ? "Join" : booking.type === "call" ? "Call" : "View"}
          </Button>
        )}
        <div className="relative">
          <button onClick={() => setMenu(!menu)} className="p-1.5 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
            <MoreHorizontal size={14} />
          </button>
          {menu && (
            <div className="absolute right-0 top-full mt-1 w-36 glass-card rounded-xl border border-riden-border overflow-hidden z-10 shadow-xl">
              <button onClick={() => { setMenu(false); onEdit(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-riden-muted hover:text-white transition-colors">
                <Edit2 size={12} /> Edit
              </button>
              <button onClick={() => { setMenu(false); onDelete(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-riden-muted transition-colors">
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch { setBookings([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this booking?")) return;
    await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    fetchBookings();
  }

  const { today, upcoming, past } = groupBookings(bookings);
  const totalToday = today.filter((b) => b.status !== "cancelled").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Bookings & Calendar</h2>
          <p className="text-sm text-slate-500">{totalToday} appointment{totalToday !== 1 ? "s" : ""} today</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchBookings}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="gradient" size="sm" onClick={() => { setEditBooking(null); setModalOpen(true); }}>
            <Plus size={14} /> New Booking
          </Button>
        </div>
      </div>

      {!loading && bookings.length === 0 && (
        <div className="glass-card rounded-xl border border-riden-border p-12 text-center">
          <Calendar size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No bookings yet</p>
          <p className="text-sm text-slate-500 mb-4">Add your first client meeting or call.</p>
          <Button variant="gradient" onClick={() => { setEditBooking(null); setModalOpen(true); }}>
            <Plus size={14} /> New Booking
          </Button>
        </div>
      )}

      {today.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Today — {formatDate(todayStr())}
          </h3>
          <div className="space-y-3">
            {today.map((b) => (
              <BookingCard key={b.id} booking={b} isToday
                onEdit={() => { setEditBooking(b); setModalOpen(true); }}
                onDelete={() => handleDelete(b.id)}
              />
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Upcoming</h3>
          <div className="space-y-3">
            {upcoming.map((b) => (
              <BookingCard key={b.id} booking={b}
                onEdit={() => { setEditBooking(b); setModalOpen(true); }}
                onDelete={() => handleDelete(b.id)}
              />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Past</h3>
          <div className="space-y-3 opacity-60">
            {past.slice(0, 5).map((b) => (
              <BookingCard key={b.id} booking={b}
                onEdit={() => { setEditBooking(b); setModalOpen(true); }}
                onDelete={() => handleDelete(b.id)}
              />
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl border border-riden-border p-4 animate-pulse flex gap-4">
              <div className="w-14 h-10 rounded bg-riden-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-riden-muted" />
                <div className="h-3 w-32 rounded bg-riden-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      <BookingModal
        open={modalOpen}
        mode={editBooking ? "edit" : "create"}
        initial={editBooking ?? undefined}
        onClose={() => { setModalOpen(false); setEditBooking(null); }}
        onSave={fetchBookings}
      />
    </div>
  );
}
