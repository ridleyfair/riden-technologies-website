"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Copy,
  Trash2,
  X,
  ExternalLink,
  RefreshCw,
  KeyRound,
  ImagePlus,
  Upload,
  Images,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { buildWebsitePreviewEmail, openEmailCompose } from "@/lib/email-outreach";
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
  outreachEmail?: string;
  lastOutreachAt?: string;
  outreachStatus?: string;
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
  heroImage: string;
  photos: string[];
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
  heroImage: "",
  photos: [],
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary"> = {
  ready: "success",
  generating: "warning",
  error: "secondary",
};

const TIER_LABELS: Record<string, string> = {
  pro: "Pro",
  pro_plus: "Pro+",
  enterprise: "Enterprise",
};

const inputCls =
  "w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors";

// ── Upload helpers ─────────────────────────────────────────────────────────────

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json() as { ok?: boolean; url?: string; error?: string };
  if (!res.ok || !data.ok) throw new Error(data.error ?? "Upload failed");
  return data.url!;
}

// ── HeroImageUpload ────────────────────────────────────────────────────────────

function HeroImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">
        Hero Image <span className="text-slate-600">(optional — JPG, PNG, WEBP · max 8 MB)</span>
      </label>

      {value ? (
        // Preview
        <div className="relative rounded-xl overflow-hidden border border-riden-border bg-riden-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Hero preview"
            className="w-full h-36 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
            <span className="text-xs text-white/70 truncate">Hero image uploaded</span>
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-1 rounded-md bg-black/40 hover:bg-red-500/80 text-white transition-colors"
              title="Remove"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      ) : (
        // Drop zone
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-riden-border bg-riden-muted hover:border-blue-500/40 hover:bg-riden-muted/80 cursor-pointer transition-colors p-6"
        >
          {uploading ? (
            <>
              <RefreshCw size={20} className="text-blue-400 animate-spin" />
              <p className="text-xs text-slate-500">Uploading…</p>
            </>
          ) : (
            <>
              <ImagePlus size={20} className="text-slate-600" />
              <p className="text-xs text-slate-500">
                Click or drag &amp; drop a hero image
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {/* URL fallback */}
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] text-slate-600 shrink-0">or paste URL:</span>
        <input
          className="flex-1 bg-riden-muted border border-riden-border rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50 transition-colors"
          placeholder="https://example.com/hero.jpg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      {error && <p className="text-[10px] text-rose-400 mt-1">{error}</p>}
    </div>
  );
}

// ── GalleryUpload ──────────────────────────────────────────────────────────────

function GalleryUpload({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setError("");
    setUploading(true);
    try {
      const urls = await Promise.all(list.map(uploadFile));
      onChange([...value, ...urls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "One or more uploads failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">
        Our Work / Gallery Photos{" "}
        <span className="text-slate-600">(optional · JPG, PNG, WEBP · max 8 MB each)</span>
      </label>

      {/* Uploaded thumbnails grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          {value.map((url, i) => (
            <div key={url + i} className="relative rounded-lg overflow-hidden aspect-square bg-riden-muted border border-riden-border group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 p-0.5 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-red-500/90 transition-all"
                title="Remove"
              >
                <X size={10} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 text-center text-[9px] text-white/50 bg-black/30 py-0.5">
                {i + 1}
              </div>
            </div>
          ))}

          {/* Add more tile */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-riden-border bg-riden-muted hover:border-blue-500/40 cursor-pointer transition-colors aspect-square"
          >
            {uploading ? (
              <RefreshCw size={14} className="text-blue-400 animate-spin" />
            ) : (
              <>
                <Upload size={14} className="text-slate-600" />
                <span className="text-[9px] text-slate-600 mt-1">Add</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Drop zone (shown when empty) */}
      {value.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-riden-border bg-riden-muted hover:border-blue-500/40 hover:bg-riden-muted/80 cursor-pointer transition-colors p-6"
        >
          {uploading ? (
            <>
              <RefreshCw size={20} className="text-blue-400 animate-spin" />
              <p className="text-xs text-slate-500">Uploading…</p>
            </>
          ) : (
            <>
              <Images size={20} className="text-slate-600" />
              <p className="text-xs text-slate-500">
                Click or drag &amp; drop gallery photos
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {value.length > 0 && (
        <p className="text-[10px] text-slate-600 mt-1">
          {value.length} photo{value.length !== 1 ? "s" : ""} added
          {uploading && " · uploading…"}
        </p>
      )}
      {error && <p className="text-[10px] text-rose-400 mt-1">{error}</p>}
    </div>
  );
}

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

  function set<K extends keyof GenerateForm>(field: K, value: GenerateForm[K]) {
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
        body: JSON.stringify({
          ...form,
          heroImage: form.heroImage || undefined,
          photos: form.photos.length > 0 ? form.photos : undefined,
        }),
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

              {/* Business details */}
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

              {/* ── Media uploads ──────────────────────────────────────────── */}
              <div className="border-t border-riden-border pt-4 space-y-4">
                <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <ImagePlus size={13} className="text-slate-500" />
                  Media (optional)
                </p>

                <HeroImageUpload
                  value={form.heroImage}
                  onChange={(url) => set("heroImage", url)}
                />

                <GalleryUpload
                  value={form.photos}
                  onChange={(urls) => set("photos", urls)}
                />
              </div>

              {/* ── Credentials ────────────────────────────────────────────── */}
              <div className="border-t border-riden-border pt-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Tier</label>
                    <select
                      className={inputCls}
                      value={form.tier}
                      onChange={(e) => set("tier", e.target.value)}
                    >
                      <option value="pro">Pro</option>
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
              </div>

              {error && <p className="text-xs text-rose-400">{error}</p>}

              {generating && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <RefreshCw size={14} className="text-blue-400 animate-spin" />
                  <p className="text-xs text-blue-300">
                    Claude is generating your website… this may take 20–40 seconds.
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
                    <RefreshCw size={13} className="animate-spin" /> Generating…
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
  const [emailWarning, setEmailWarning] = useState<string | null>(null);

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

  async function handleEmailPreview(site: GeneratedSite) {
    if (!site.previewUrl) return;
    if (!site.outreachEmail) {
      setEmailWarning(site.id);
      setTimeout(() => setEmailWarning(null), 4000);
      return;
    }
    const email = buildWebsitePreviewEmail({
      businessName: site.businessName,
      contactEmail: site.outreachEmail,
      previewUrl: site.previewUrl,
      industry: site.industry,
    });
    openEmailCompose(email);
    // Track the outreach
    await fetch(`/api/generated-sites/${site.id}/outreach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Preview Email Prepared" }),
    });
    // Refresh to show updated status
    fetchSites();
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

                {/* Email Website Preview button */}
                {site.previewUrl && (
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs text-violet-400 border-violet-500/30 hover:border-violet-500/60 hover:bg-violet-500/10"
                      onClick={() => handleEmailPreview(site)}
                    >
                      <Mail size={11} />
                      Email Website Preview
                    </Button>
                    {emailWarning === site.id && (
                      <p className="flex items-center gap-1 text-[11px] text-amber-400 mt-1.5">
                        <AlertTriangle size={11} />
                        No email saved for this business — add one in Website Brief
                      </p>
                    )}
                  </div>
                )}

                {/* Outreach status + date */}
                <div className="flex items-center justify-between border-t border-riden-border pt-3">
                  <div className="text-[10px] text-slate-600">
                    Generated{" "}
                    {new Date(site.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  {site.outreachStatus && site.outreachStatus !== "not_contacted" && (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/10 border border-violet-500/20 text-violet-400">
                        <Mail size={9} />
                        {site.outreachStatus}
                      </span>
                      {site.lastOutreachAt && (
                        <div className="text-[10px] text-slate-600 mt-0.5">
                          {new Date(site.lastOutreachAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                      )}
                    </div>
                  )}
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
