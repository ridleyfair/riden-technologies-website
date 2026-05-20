"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Users, Banknote, Globe, MoreHorizontal, RefreshCw, X,
  Phone, Mail, Building2, Calendar, TrendingUp, CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const tierBadge: Record<string, "default" | "violet" | "cyan"> = {
  starter: "default",
  growth: "violet",
  enterprise: "cyan",
};

const TIER_RATES: Record<string, number> = {
  starter: 25,
  growth: 50,
  enterprise: 100,
};

type Client = {
  id: string; name: string; email: string; company: string;
  tier: string; status: string; revenue: number; websites: number;
  notes?: string; createdAt: string; phone?: string;
  monthlyRate?: number; activeFrom?: string | null; profit?: number;
};

/* ── Add Client Modal ─────────────────────────────────────────────── */
function AddClientModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", tier: "starter", status: "active" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setForm({ name: "", email: "", company: "", phone: "", tier: "starter", status: "active" }); setError(""); }
  }, [open]);

  function setField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const inputCls = "w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50";

  async function handleSave() {
    if (!form.name || !form.company) { setError("Name and company are required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          monthlyRate: TIER_RATES[form.tier] ?? 25,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to save."); return; }
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
            className="relative w-full max-w-lg glass-card rounded-2xl border border-riden-border"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-riden-border">
              <h2 className="text-base font-semibold text-white">Add Client</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Full Name *", field: "name", placeholder: "Jane Smith" },
                  { label: "Email", field: "email", placeholder: "jane@company.com" },
                  { label: "Company *", field: "company", placeholder: "Acme Corp" },
                  { label: "Phone", field: "phone", placeholder: "+44 7700 900000" },
                ].map(({ label, field, placeholder }) => (
                  <div key={field}>
                    <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
                    <input value={form[field as keyof typeof form]} onChange={(e) => setField(field, e.target.value)}
                      placeholder={placeholder} className={inputCls} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Tier</label>
                  <select value={form.tier} onChange={(e) => setField("tier", e.target.value)} className={inputCls}>
                    {Object.keys(TIER_RATES).map((t) => (
                      <option key={t} value={t} className="bg-riden-surface capitalize">
                        {t.charAt(0).toUpperCase() + t.slice(1)} — £{TIER_RATES[t]}/mo
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setField("status", e.target.value)} className={inputCls}>
                    {["active", "inactive", "churned"].map((s) => <option key={s} value={s} className="bg-riden-surface capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-500">Monthly rate auto-set to £{TIER_RATES[form.tier]}/mo based on tier.</p>
              {error && <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-riden-border">
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button variant="gradient" size="sm" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Add Client"}</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── Client Detail Modal ──────────────────────────────────────────── */
function ClientDetailModal({ client, onClose, onUpdate }: { client: Client; onClose: () => void; onUpdate: () => void }) {
  const [status, setStatus] = useState(client.status);
  const [profit, setProfit] = useState(String(client.profit ?? client.revenue ?? 0));
  const [monthlyRate, setMonthlyRate] = useState(String(client.monthlyRate ?? TIER_RATES[client.tier] ?? 25));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function saveChanges(overrides?: Record<string, unknown>) {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          profit: parseFloat(profit) || 0,
          monthlyRate: parseFloat(monthlyRate) || 0,
          ...overrides,
        }),
      });
      if (!res.ok) { setError("Failed to update client."); return; }
      setSaved(true);
      onUpdate();
      setTimeout(() => setSaved(false), 2000);
    } catch { setError("Network error."); } finally { setSaving(false); }
  }

  async function changeStatus(newStatus: string) {
    setStatus(newStatus);
    await saveChanges({ status: newStatus });
  }

  async function deleteClient() {
    if (!confirm(`Delete ${client.company}? This cannot be undone.`)) return;
    await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    onUpdate();
    onClose();
  }

  const mrr = parseFloat(monthlyRate) || 0;
  const profitNum = parseFloat(profit) || 0;
  const activeSince = client.activeFrom ? new Date(client.activeFrom) : null;
  const monthsActive = activeSince
    ? Math.max(0, Math.floor((Date.now() - activeSince.getTime()) / (1000 * 60 * 60 * 24 * 30)))
    : 0;
  const totalRecurring = mrr * monthsActive;

  const inputCls = "w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors";

  const infoRow = (icon: React.ReactNode, label: string, value: string | number | null | undefined) =>
    value ? (
      <div className="flex items-center gap-3 py-2.5 border-b border-riden-border/50 last:border-0">
        <div className="w-7 h-7 rounded-lg bg-riden-muted flex items-center justify-center flex-shrink-0 text-slate-500">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-slate-500 mb-0.5">{label}</div>
          <div className="text-sm text-white truncate">{value}</div>
        </div>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg glass-card rounded-2xl border border-riden-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-riden-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-base font-bold text-white">
              {client.company[0]}
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{client.company}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={tierBadge[client.tier] ?? "default"} className="capitalize text-[10px]">{client.tier}</Badge>
                <span className={`text-[10px] font-medium capitalize ${status === "active" ? "text-emerald-400" : "text-slate-400"}`}>{status}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Financials (editable) */}
        <div className="p-4 border-b border-riden-border space-y-3">
          <div className="text-xs text-slate-500 mb-1">Financials</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1.5">Project Profit (£)</label>
              <input
                type="number" min="0" step="0.01"
                value={profit}
                onChange={(e) => setProfit(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1.5">Monthly Rate (£/mo)</label>
              <input
                type="number" min="0" step="1"
                value={monthlyRate}
                onChange={(e) => setMonthlyRate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-riden-surface rounded-xl border border-riden-border">
              <div className="text-sm font-bold text-emerald-400">{formatCurrency(profitNum)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Profit</div>
            </div>
            <div className="text-center p-2 bg-riden-surface rounded-xl border border-riden-border">
              <div className="text-sm font-bold text-cyan-400">{formatCurrency(mrr)}<span className="text-[10px] text-slate-500">/mo</span></div>
              <div className="text-[10px] text-slate-500 mt-0.5">Monthly Rate</div>
            </div>
            <div className="text-center p-2 bg-riden-surface rounded-xl border border-riden-border">
              <div className="text-sm font-bold text-violet-400">{formatCurrency(totalRecurring)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Recurring{monthsActive > 0 ? ` (${monthsActive}mo)` : ""}</div>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="gradient" size="sm" className="flex-1" onClick={() => saveChanges()} disabled={saving}>
              {saved ? <><CheckCircle size={13} className="mr-1" /> Saved</> : saving ? "Saving..." : "Save Changes"}
            </Button>
            <div className="flex gap-1">
              {[25, 50, 100].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setMonthlyRate(String(rate))}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all border ${
                    parseFloat(monthlyRate) === rate
                      ? "bg-blue-600/10 text-blue-400 border-blue-500/20"
                      : "text-slate-500 border-riden-border hover:text-white hover:bg-riden-muted"
                  }`}
                >
                  £{rate}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>

        {/* Details */}
        <div className="px-5 py-3 max-h-52 overflow-y-auto portal-scroll">
          {infoRow(<Users size={13} />, "Contact", client.name)}
          {infoRow(<Mail size={13} />, "Email", client.email)}
          {infoRow(<Phone size={13} />, "Phone", client.phone)}
          {infoRow(<Building2 size={13} />, "Company", client.company)}
          {infoRow(<Globe size={13} />, "Websites", client.websites > 0 ? `${client.websites} site${client.websites !== 1 ? "s" : ""} managed` : null)}
          {infoRow(<Calendar size={13} />, "Active Since", activeSince ? activeSince.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null)}
          {infoRow(<TrendingUp size={13} />, "Months Active", monthsActive > 0 ? `${monthsActive} month${monthsActive !== 1 ? "s" : ""}` : null)}
          {client.notes && infoRow(<Building2 size={13} />, "Notes", client.notes)}
          <div className="py-2.5">
            <div className="text-[10px] text-slate-500 mb-0.5">Client since</div>
            <div className="text-sm text-white">{new Date(client.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
          </div>
        </div>

        {/* Status */}
        <div className="px-5 pb-4 border-t border-riden-border pt-4">
          <div className="text-xs text-slate-500 mb-2">Update Status</div>
          <div className="flex gap-2">
            {["active", "inactive", "churned"].map((s) => (
              <button
                key={s}
                disabled={saving || status === s}
                onClick={() => changeStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  status === s
                    ? s === "active" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-riden-muted text-slate-300 border border-riden-border"
                    : "text-slate-500 hover:text-white hover:bg-riden-muted border border-transparent"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between px-5 py-3 border-t border-riden-border">
          <Button variant="ghost" size="sm" className="text-rose-400 hover:text-rose-300" onClick={deleteClient}>
            Delete Client
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main View ────────────────────────────────────────────────────── */
export default function ClientsView() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [viewClient, setViewClient] = useState<Client | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch { setClients([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const filtered = clients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === "all" || c.tier === tierFilter;
    return matchSearch && matchTier;
  });

  const totalProfit = clients.reduce((s, c) => s + Number(c.profit ?? c.revenue ?? 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">Client Management</h2>
          <p className="text-xs sm:text-sm text-slate-500">{clients.filter((c) => c.status === "active").length} active clients</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={fetchClients}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="gradient" size="sm" className="flex-shrink-0" onClick={() => setAddOpen(true)}>
            <Plus size={14} />
            <span className="hidden sm:inline">Add Client</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total Clients", value: clients.length, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Active", value: clients.filter((c) => c.status === "active").length, icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Total Profit", value: formatCurrency(totalProfit), icon: Banknote, color: "text-violet-400", bg: "bg-violet-500/10" },
          { label: "Websites Managed", value: clients.reduce((s, c) => s + (Number(c.websites) || 0), 0), icon: Globe, color: "text-cyan-400", bg: "bg-cyan-500/10" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl border border-riden-border p-3 sm:p-4 flex items-center gap-3 sm:gap-4"
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
              <stat.icon size={16} className={stat.color} />
            </div>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-bold text-white truncate">{stat.value}</div>
              <div className="text-[10px] sm:text-xs text-slate-500 leading-tight">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-riden-muted border border-riden-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 flex-nowrap sm:flex-wrap scrollbar-hide">
          {["all", "starter", "growth", "enterprise"].map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize whitespace-nowrap flex-shrink-0 ${
                tierFilter === t
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                  : "text-slate-500 hover:text-white hover:bg-riden-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Client Cards */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl border border-riden-border p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-riden-muted" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-28 h-3.5 rounded bg-riden-muted" />
                  <div className="w-20 h-2.5 rounded bg-riden-muted" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, j) => <div key={j} className="h-12 rounded-lg bg-riden-muted" />)}
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl border border-riden-border py-16 text-center text-slate-500">
          {clients.length === 0 ? "No clients yet — add your first client." : "No clients match your search."}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setViewClient(client)}
              className="glass-card rounded-xl border border-riden-border p-5 hover:border-white/10 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {client.company[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{client.company}</div>
                    <div className="text-xs text-slate-500">{client.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={tierBadge[client.tier] ?? "default"} className="capitalize text-[10px]">{client.tier}</Badge>
                  <button
                    className="p-1 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors"
                    onClick={(e) => { e.stopPropagation(); setViewClient(client); }}
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-riden-surface rounded-lg border border-riden-border">
                  <div className="text-sm font-bold text-white">{formatCurrency(Number(client.profit ?? client.revenue ?? 0))}</div>
                  <div className="text-[10px] text-slate-500">Profit</div>
                </div>
                <div className="text-center p-2 bg-riden-surface rounded-lg border border-riden-border">
                  <div className="text-sm font-bold text-white">{client.websites ?? 0}</div>
                  <div className="text-[10px] text-slate-500">Sites</div>
                </div>
                <div className="text-center p-2 bg-riden-surface rounded-lg border border-riden-border">
                  <div className={`text-sm font-bold capitalize ${client.status === "active" ? "text-emerald-400" : "text-slate-400"}`}>
                    {client.status}
                  </div>
                  <div className="text-[10px] text-slate-500">Status</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500 truncate">{client.email || client.phone || "—"}</div>
                {Number(client.monthlyRate ?? 0) > 0 && (
                  <div className="text-xs text-cyan-400 flex-shrink-0">{formatCurrency(Number(client.monthlyRate))}/mo</div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AddClientModal open={addOpen} onClose={() => setAddOpen(false)} onSave={fetchClients} />

      <AnimatePresence>
        {viewClient && (
          <ClientDetailModal
            client={viewClient}
            onClose={() => setViewClient(null)}
            onUpdate={fetchClients}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
