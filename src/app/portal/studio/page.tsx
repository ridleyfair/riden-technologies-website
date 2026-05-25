"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Copy,
  Trash2,
  X,
  ExternalLink,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ── Types ──────────────────────────────────────────────────────────────────────

type GeneratedSite = {
  id: string;
  projectId?: string;
  clientName: string;
  businessName: string;
  industry: string;
  tier: string;
  username: string;
  password: string;
  previewUrl?: string;
  status: string;
  createdAt: string;
};

type GenerateForm = {
  businessName: string;
  clientName: string;
  industry: string;
  city: string;
  phone: string;
  email: string;
  services: string;
  tier: string;
  username: string;
  password: string;
  notes: string;
};

const DEFAULT_FORM: GenerateForm = {
  businessName: "",
  clientName: "",
  industry: "professional",
  city: "",
  phone: "",
  email: "",
  services: "",
  tier: "pro_plus",
  username: "",
  password: "",
  notes: "",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary"> = {
  ready: "success",
  generating: "warning",
  error: "secondary",
};

const TIER_LABELS: Record<string, string> = {
  starter: "Starter",
  pro_plus: "Pro+",
  enterprise: "Enterprise",
};

const inputCls =
  "w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors";

// ── Generate Modal ─────────────────────────────────────────────────────────────

function GenerateModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<GenerateForm>(DEFAULT_FORM);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(DEFAULT_FORM);
      setError("");
    }
  }, [open]);

  function set(field: keyof GenerateForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleGenerate() {
    if (!form.businessName || !form.clientName || !form.username || !form.password) {
      setError("Business name, client name, username, and password are required.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/generate-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Generation failed. Please try again.");
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl glass-card rounded-2xl border border-riden-border max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-riden-border">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-400" />
                <h2 className="text-base font-semibold text-white">Generate New Website</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto portal-scroll flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Business Name *</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. Smith Plumbing"
                    value={form.businessName}
                    onChange={(e) => set("businessName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Client Name *</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. John Smith"
                    value={form.clientName}
                    onChange={(e) => set("clientName", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Industry</label>
                  <select
                    className={inputCls}
                    value={form.industry}
                    onChange={(e) => set("industry", e.target.value)}
                  >
                    <option value="professional">Professional</option>
                    <option value="trades">Trades</option>
                    <option value="hospitality">Hospitality</option>
                    <option value="beauty">Beauty</option>
                    <option value="health">Health</option>
                    <option value="retail">Retail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">City / Location</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. London"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Phone</label>
                  <input
                    className={inputCls}
                    placeholder="+44 7700 900000"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Email</label>
                  <input
                    className={inputCls}
                    placeholder="info@business.com"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Services</label>
                <textarea
                  className={inputCls}
                  rows={3}
                  placeholder="List the services offered, e.g. Emergency plumbing, Boiler installation, Bathroom fitting..."
                  value={form.services}
                  onChange={(e) => set("services", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Notes / Brief</label>
                <textarea
                  className={inputCls}
                  rows={2}
                  placeholder="Any specific tone, unique selling points, or requirements..."
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Tier</label>
                  <select
                    className={inputCls}
                    value={form.tier}
                    onChange={(e) => set("tier", e.target.value)}
                  >
                    <option value="starter">Starter</option>
                    <option value="pro_plus">Pro+</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Preview Username *</label>
                  <input
                    className={inputCls}
                    placeholder="client-username"
                    value={form.username}
                    onChange={(e) => set("username", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Preview Password *</label>
                  <input
                    className={inputCls}
                    placeholder="secure-password"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                  />
                </div>
              </div>

              {error && <p className="text-xs text-rose-400">{error}</p>}

              {generating && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <RefreshCw size={14} className="text-blue-400 animate-spin" />
                  <p className="text-xs text-blue-300">
                    Claude is generating your website... this may take 20–40 seconds.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-5 py-4 border-t border-riden-border">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={generating}>
                Cancel
              </Button>
              <Button
                variant="gradient"
                className="flex-1"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={13} /> Generate Website
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function StudioPage() {
  const [sites, setSites] = useState<GeneratedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchSites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generated-sites");
      const data = await res.json();
      setSites(Array.isArray(data) ? (data as GeneratedSite[]) : []);
    } catch {
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this generated website? This cannot be undone.")) return;
    await fetch(`/api/generated-sites/${id}`, { method: "DELETE" });
    fetchSites();
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text).catch(() => null);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Website Studio</h2>
          <p className="text-sm text-slate-500">
            {sites.length} generated site{sites.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSites}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="gradient" size="sm" onClick={() => setModalOpen(true)}>
            <Sparkles size={14} /> Generate New Website
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {!loading && sites.length === 0 && (
        <div className="glass-card rounded-xl border border-riden-border p-12 text-center">
          <Sparkles size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No generated websites yet</p>
          <p className="text-sm text-slate-500 mb-4">
            Use Claude AI to generate a full client website in seconds.
          </p>
          <Button variant="gradient" onClick={() => setModalOpen(true)}>
            <Sparkles size={14} /> Generate New Website
          </Button>
        </div>
      )}

      {/* Site cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="glass-card rounded-xl border border-riden-border p-5 animate-pulse space-y-3"
              >
                <div className="h-4 w-40 rounded bg-riden-muted" />
                <div className="h-3 w-28 rounded bg-riden-muted" />
                <div className="h-3 w-24 rounded bg-riden-muted" />
              </div>
            ))
          : sites.map((site, i) => (
              <motion.div
                key={site.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass-card rounded-xl border border-riden-border p-5 flex flex-col gap-4 hover:border-white/10 transition-all"
              >
                {/* Card top */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white truncate">
                      {site.businessName}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{site.clientName}</div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge
                        variant={STATUS_VARIANT[site.status] ?? "secondary"}
                        className="text-[10px] capitalize"
                      >
                        {site.status}
                      </Badge>
                      <span className="text-[10px] text-slate-600 uppercase tracking-wide">
                        {TIER_LABELS[site.tier] ?? site.tier}
                      </span>
                      <span className="text-[10px] text-slate-600 capitalize">{site.industry}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(site.id)}
                    className="flex-shrink-0 p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-riden-muted transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Preview URL */}
                {site.previewUrl && (
                  <a
                    href={site.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-mono truncate transition-colors"
                  >
                    <ExternalLink size={11} className="flex-shrink-0" />
                    <span className="truncate">{site.previewUrl}</span>
                  </a>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  {site.previewUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() =>
                        copyToClipboard(site.previewUrl!, `link-${site.id}`)
                      }
                    >
                      <Copy size={11} />
                      {copiedId === `link-${site.id}` ? "Copied!" : "Copy Link"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() =>
                      copyToClipboard(
                        `Username: ${site.username}\nPassword: ${site.password}`,
                        `creds-${site.id}`
                      )
                    }
                  >
                    <KeyRound size={11} />
                    {copiedId === `creds-${site.id}` ? "Copied!" : "Copy Credentials"}
                  </Button>
                </div>

                {/* Date */}
                <div className="text-[10px] text-slate-600 border-t border-riden-border pt-3">
                  Generated{" "}
                  {new Date(site.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </motion.div>
            ))}
      </div>

      {/* Modal */}
      <GenerateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchSites}
      />
    </div>
  );
}
