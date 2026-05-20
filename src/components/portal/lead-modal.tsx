"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeadModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

const SOURCES = ["website", "referral", "social", "email", "cold", "ad", "event", "other", "manual"];
const STATUSES = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];

export default function LeadModal({ open, onClose, onSave }: LeadModalProps) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", service: "",
    message: "", status: "new", source: "manual", value: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({ name: "", email: "", phone: "", company: "", service: "", message: "", status: "new", source: "manual", value: "", notes: "" });
      setError("");
    }
  }, [open]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required."); return;
    }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, value: parseFloat(form.value) || 0 }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to save lead."); return;
      }
      onSave(); onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors";

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
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg glass-card rounded-2xl border border-riden-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-riden-border">
              <h2 className="text-base font-semibold text-white">Add New Lead</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Full Name *</label>
                  <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="John Smith" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="john@company.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Phone</label>
                  <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 555 0100" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Company</label>
                  <input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Acme Corp" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Service Interested</label>
                  <input value={form.service} onChange={(e) => set("service", e.target.value)} placeholder="Website, Automation..." className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Deal Value ($)</label>
                  <input type="number" min="0" value={form.value} onChange={(e) => set("value", e.target.value)} placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
                    {STATUSES.map((s) => <option key={s} value={s} className="bg-riden-surface capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Source</label>
                  <select value={form.source} onChange={(e) => set("source", e.target.value)} className={inputCls}>
                    {SOURCES.map((s) => <option key={s} value={s} className="bg-riden-surface capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {error && (
                <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-riden-border">
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button variant="gradient" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Add Lead"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
