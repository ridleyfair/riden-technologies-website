"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Plus, ExternalLink, RefreshCw, Eye, MoreHorizontal, X, Trash2, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Website = {
  id: string; name: string; client: string; clientId?: string;
  url: string; status: string; tier: string; template: string; views: number; createdAt: string;
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary"> = {
  live: "success", building: "warning", draft: "secondary",
};

const TEMPLATES = [
  "Custom Design", "SaaS Premium", "E-Commerce Pro", "Local Business",
  "Professional Services", "Health & Fitness", "Portfolio", "Restaurant",
];

const inputCls = "w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors";

function WebsiteModal({
  open, mode, initial, onClose, onSave,
}: {
  open: boolean; mode: "create" | "edit"; initial?: Partial<Website>;
  onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({ name: "", client: "", url: "", status: "building", tier: "pro", template: "Custom Design" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({ name: initial?.name ?? "", client: initial?.client ?? "", url: initial?.url ?? "", status: initial?.status ?? "building", tier: initial?.tier ?? "pro", template: initial?.template ?? "Custom Design" });
      setError("");
    }
  }, [open, initial]);

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSave() {
    if (!form.name || !form.client || !form.url) { setError("Name, client and URL are required."); return; }
    setSaving(true); setError("");
    try {
      const url = mode === "edit" && initial?.id ? `/api/websites/${initial.id}` : "/api/websites";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
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
              <h2 className="text-base font-semibold text-white">{mode === "create" ? "Add Website" : "Edit Website"}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Website Name</label>
                <input className={inputCls} placeholder="e.g. RetailEdge Store" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Client Name</label>
                <input className={inputCls} placeholder="Client or company" value={form.client} onChange={(e) => set("client", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Domain / URL</label>
                <input className={inputCls} placeholder="example.com" value={form.url} onChange={(e) => set("url", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                    <option value="building">Building</option>
                    <option value="live">Live</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Tier</label>
                  <select className={inputCls} value={form.tier} onChange={(e) => set("tier", e.target.value)}>
                    <option value="pro">Pro</option>
                    <option value="pro_plus">Pro+</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Template</label>
                <select className={inputCls} value={form.template} onChange={(e) => set("template", e.target.value)}>
                  {TEMPLATES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {error && <p className="text-xs text-rose-400">{error}</p>}
            </div>
            <div className="flex gap-3 px-5 py-4 border-t border-riden-border">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button variant="gradient" className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : mode === "create" ? "Add Website" : "Save Changes"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSite, setEditSite] = useState<Website | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  const fetchWebsites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/websites");
      const data = await res.json();
      setWebsites(Array.isArray(data) ? data : []);
    } catch { setWebsites([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchWebsites(); }, [fetchWebsites]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this website?")) return;
    await fetch(`/api/websites/${id}`, { method: "DELETE" });
    fetchWebsites();
  }

  const liveCount = websites.filter((w) => w.status === "live").length;
  const buildingCount = websites.filter((w) => w.status === "building").length;
  const totalViews = websites.reduce((s, w) => s + (w.views || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Website Management</h2>
          <p className="text-sm text-slate-500">{liveCount} website{liveCount !== 1 ? "s" : ""} live</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchWebsites}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="gradient" size="sm" onClick={() => { setEditSite(null); setModalOpen(true); }}>
            <Plus size={14} /> Add Website
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Websites", value: websites.length },
          { label: "Live", value: liveCount },
          { label: "Building", value: buildingCount },
          { label: "Total Views", value: totalViews.toLocaleString() },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl border border-riden-border p-4 text-center">
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {!loading && websites.length === 0 && (
        <div className="glass-card rounded-xl border border-riden-border p-12 text-center">
          <Globe size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No websites yet</p>
          <p className="text-sm text-slate-500 mb-4">Add a website to start tracking client sites.</p>
          <Button variant="gradient" onClick={() => { setEditSite(null); setModalOpen(true); }}>
            <Plus size={14} /> Add Website
          </Button>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl border border-riden-border overflow-hidden animate-pulse">
                <div className="h-32 bg-riden-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-32 rounded bg-riden-muted" />
                  <div className="h-3 w-24 rounded bg-riden-muted" />
                </div>
              </div>
            ))
          : websites.map((site, i) => (
              <motion.div key={site.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass-card rounded-xl border border-riden-border overflow-hidden hover:border-white/10 transition-all group">
                <div className="h-32 bg-gradient-to-br from-blue-600/20 via-riden-surface to-violet-600/20 relative flex items-center justify-center border-b border-riden-border">
                  <Globe size={32} className="text-blue-400/30" />
                  <div className="absolute top-3 right-3">
                    <Badge variant={STATUS_VARIANT[site.status] ?? "secondary"} className="text-[10px] capitalize">{site.status}</Badge>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{site.name}</div>
                      <div className="text-xs text-slate-500">{site.client}</div>
                    </div>
                    <div className="relative flex-shrink-0">
                      <button onClick={() => setMenuId(menuId === site.id ? null : site.id)}
                        className="p-1 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
                        <MoreHorizontal size={14} />
                      </button>
                      {menuId === site.id && (
                        <div className="absolute right-0 top-full mt-1 w-36 glass-card rounded-xl border border-riden-border overflow-hidden z-10 shadow-xl">
                          <button onClick={() => { setMenuId(null); setEditSite(site); setModalOpen(true); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-riden-muted hover:text-white transition-colors">
                            <Edit2 size={12} /> Edit
                          </button>
                          <button onClick={() => { setMenuId(null); handleDelete(site.id); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-riden-muted transition-colors">
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <ExternalLink size={12} className="text-slate-600 flex-shrink-0" />
                    <span className="text-xs text-blue-400 font-mono truncate">{site.url}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span className="capitalize">{site.tier} tier</span>
                    <span className="flex items-center gap-1"><Eye size={11} /> {(site.views || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs">
                      <Eye size={12} /> Preview
                    </Button>
                    {site.status !== "live" && (
                      <Button variant="ghost" size="sm" className="text-xs"
                        onClick={async () => { await fetch(`/api/websites/${site.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "live" }) }); fetchWebsites(); }}>
                        Go Live
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: websites.length * 0.06 }}
          onClick={() => { setEditSite(null); setModalOpen(true); }}
          className="glass-card rounded-xl border border-dashed border-riden-border p-5 flex flex-col items-center justify-center gap-3 hover:border-blue-500/30 transition-all cursor-pointer group min-h-[240px]">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
            <Plus size={22} className="text-blue-400" />
          </div>
          <div className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">Add New Website</div>
          <div className="text-xs text-slate-600 text-center">Track a client website</div>
        </motion.div>
      </div>

      <WebsiteModal
        open={modalOpen} mode={editSite ? "edit" : "create"} initial={editSite ?? undefined}
        onClose={() => { setModalOpen(false); setEditSite(null); }} onSave={fetchWebsites}
      />
    </div>
  );
}
