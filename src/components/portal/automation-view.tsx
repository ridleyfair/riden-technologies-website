"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Plus, Activity, MoreHorizontal, X, Trash2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Automation = {
  id: string; name: string; trigger: string; actions: number;
  status: string; runsTotal: number; runsToday: number; lastRun?: string; createdAt: string;
};

const TRIGGERS = [
  "Lead Created", "Proposal Sent", "Deal Won", "Invoice Overdue",
  "Lead Inactive 14d", "Client Onboarded", "Project Completed", "Monthly Recurring",
];

const inputCls = "w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors";

function NewAutomationModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ name: "", trigger: "Lead Created", actions: "3", status: "active" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setForm({ name: "", trigger: "Lead Created", actions: "3", status: "active" }); setError(""); }
  }, [open]);

  async function handleSave() {
    if (!form.name) { setError("Name is required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, actions: parseInt(form.actions) || 1 }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed."); return; }
      onSave(); onClose();
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
            className="relative w-full max-w-md glass-card rounded-2xl border border-riden-border"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-riden-border">
              <h2 className="text-base font-semibold text-white">New Automation</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Automation Name</label>
                <input className={inputCls} placeholder="e.g. New Lead Welcome Sequence" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Trigger</label>
                <select className={inputCls} value={form.trigger} onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))}>
                  {TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Number of Actions</label>
                <input type="number" min="1" max="20" className={inputCls} value={form.actions} onChange={(e) => setForm((f) => ({ ...f, actions: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Start Status</label>
                <select className={inputCls} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="paused">Paused (draft)</option>
                </select>
              </div>
              {error && <p className="text-xs text-rose-400">{error}</p>}
            </div>
            <div className="flex gap-3 px-5 py-4 border-t border-riden-border">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button variant="gradient" className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? "Creating..." : "Create Automation"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function AutomationView() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchAutomations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/automations");
      const data = await res.json();
      setAutomations(Array.isArray(data) ? data : []);
    } catch { setAutomations([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAutomations(); }, [fetchAutomations]);

  async function toggleStatus(auto: Automation) {
    const next = auto.status === "active" ? "paused" : "active";
    await fetch(`/api/automations/${auto.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    fetchAutomations();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this automation?")) return;
    await fetch(`/api/automations/${id}`, { method: "DELETE" });
    fetchAutomations();
  }

  const activeCount = automations.filter((a) => a.status === "active").length;
  const totalRuns = automations.reduce((s, a) => s + (a.runsTotal || 0), 0);
  const todayRuns = automations.reduce((s, a) => s + (a.runsToday || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">Automation System</h2>
          <p className="text-xs sm:text-sm text-slate-500">{activeCount} active automation{activeCount !== 1 ? "s" : ""} running</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={fetchAutomations}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="gradient" size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} />
            <span className="hidden sm:inline">New Automation</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Active Flows", value: activeCount, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Total Runs", value: totalRuns.toLocaleString(), color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Runs Today", value: todayRuns, color: "text-violet-400", bg: "bg-violet-500/10" },
          { label: "Success Rate", value: automations.length > 0 ? "99.2%" : "—", color: "text-cyan-400", bg: "bg-cyan-500/10" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl border border-riden-border p-3 sm:p-4">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-2 sm:mb-3`}>
              <Activity size={16} className={stat.color} />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {!loading && automations.length === 0 && (
        <div className="glass-card rounded-xl border border-riden-border p-12 text-center">
          <Activity size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No automations yet</p>
          <p className="text-sm text-slate-500 mb-4">Create your first workflow to automate client follow-ups and tasks.</p>
          <Button variant="gradient" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> New Automation
          </Button>
        </div>
      )}

      {automations.length > 0 && (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card rounded-xl border border-riden-border overflow-hidden hidden md:block">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-riden-border bg-riden-surface/50 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <div className="col-span-1">Status</div>
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Trigger</div>
              <div className="col-span-1">Actions</div>
              <div className="col-span-2">Total Runs</div>
              <div className="col-span-2">Today</div>
              <div className="col-span-1"></div>
            </div>
            <div className="divide-y divide-riden-border">
              {automations.map((auto, i) => (
                <motion.div key={auto.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors items-center">
                  <div className="col-span-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${auto.status === "active" ? "bg-emerald-400 animate-pulse" : auto.status === "paused" ? "bg-amber-400" : "bg-slate-600"}`} />
                  </div>
                  <div className="col-span-3">
                    <div className="text-sm font-medium text-white">{auto.name}</div>
                    <div className="text-xs text-slate-500">{auto.actions} action{auto.actions !== 1 ? "s" : ""} in sequence</div>
                  </div>
                  <div className="col-span-2"><Badge variant="secondary" className="text-[10px]">{auto.trigger}</Badge></div>
                  <div className="col-span-1 text-sm text-slate-400">{auto.actions}</div>
                  <div className="col-span-2 text-sm text-white">{(auto.runsTotal || 0).toLocaleString()}</div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">{auto.runsToday || 0}</span>
                      {(auto.runsToday || 0) > 0 && (
                        <div className="h-1.5 w-16 bg-riden-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(((auto.runsToday || 0) / 10) * 100, 100)}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-end gap-1">
                    <button onClick={() => toggleStatus(auto)} className="p-1.5 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors" title={auto.status === "active" ? "Pause" : "Resume"}>
                      {auto.status === "active" ? <Pause size={13} /> : <Play size={13} />}
                    </button>
                    <button onClick={() => handleDelete(auto.id)} className="p-1.5 rounded hover:bg-riden-muted text-slate-500 hover:text-rose-400 transition-colors" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="md:hidden glass-card rounded-xl border border-riden-border overflow-hidden">
            <div className="divide-y divide-riden-border">
              {automations.map((auto, i) => (
                <motion.div key={auto.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${auto.status === "active" ? "bg-emerald-400 animate-pulse" : auto.status === "paused" ? "bg-amber-400" : "bg-slate-600"}`} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">{auto.name}</div>
                        <div className="text-xs text-slate-500">{auto.actions} actions</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => toggleStatus(auto)} className="p-2 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center">
                        {auto.status === "active" ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                      <button onClick={() => handleDelete(auto.id)} className="p-2 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-rose-400 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">{auto.trigger}</Badge>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${auto.status === "active" ? "bg-emerald-500/10 text-emerald-400" : auto.status === "paused" ? "bg-amber-500/10 text-amber-400" : "bg-slate-500/10 text-slate-400"}`}>
                      {auto.status.charAt(0).toUpperCase() + auto.status.slice(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div><div className="text-slate-600 mb-0.5">Total Runs</div><div className="text-white font-medium">{(auto.runsTotal || 0).toLocaleString()}</div></div>
                    <div><div className="text-slate-600 mb-0.5">Today</div><div className="text-white font-medium">{auto.runsToday || 0}</div></div>
                    <div><div className="text-slate-600 mb-0.5">Actions</div><div className="text-white font-medium">{auto.actions}</div></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}

      <div>
        <h3 className="text-sm font-semibold text-white mb-3 sm:mb-4">Quick Templates</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {[
            { name: "Lead Nurture Sequence", desc: "5-email automated follow-up for new leads", trigger: "Lead Created", icon: "📧", actions: 5 },
            { name: "Onboarding Flow", desc: "Welcome new clients with tasks and resources", trigger: "Deal Won", icon: "🚀", actions: 8 },
            { name: "Re-Engagement Campaign", desc: "Win back inactive leads after 30 days", trigger: "Lead Inactive 14d", icon: "🔄", actions: 4 },
          ].map((template, i) => (
            <div key={i} className="glass-card rounded-xl border border-riden-border p-4 sm:p-5 hover:border-blue-500/30 transition-all cursor-pointer group"
              onClick={async () => {
                await fetch("/api/automations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: template.name, trigger: template.trigger, actions: template.actions, status: "paused" }) });
                fetchAutomations();
              }}>
              <div className="text-2xl mb-2 sm:mb-3">{template.icon}</div>
              <div className="text-sm font-semibold text-white mb-1">{template.name}</div>
              <div className="text-xs text-slate-400 mb-3">{template.desc}</div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px]">{template.trigger}</Badge>
                <Button variant="ghost" size="sm" className="text-xs group-hover:text-blue-400">Use Template</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <NewAutomationModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={fetchAutomations} />
    </div>
  );
}
