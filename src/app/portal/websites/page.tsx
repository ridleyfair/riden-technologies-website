"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, RefreshCw, Eye, ExternalLink, Copy, Check, X,
  CloudUpload, AlertTriangle, CheckCircle,
  Clock, Wifi, Shield, MoreHorizontal, ChevronRight, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────

type DeploymentStatus =
  | "preview_ready" | "domain_pending" | "dns_pending"
  | "ssl_pending"   | "live"           | "update_available"
  | "publish_failed"| "draft";

type Site = {
  id:               string;
  projectId?:       string;
  clientName:       string;
  businessName:     string;
  industry:         string;
  tier:             string;
  previewUrl:       string;
  status:           string;
  deploymentStatus: DeploymentStatus;
  dnsStatus:        string;
  sslStatus:        string;
  liveDomain?:      string;
  wwwDomain?:       string;
  apexDomain?:      string;
  publishTarget?:   string;
  cloudflareZoneId?:string;
  deploymentError?: string;
  lastPublishedAt?: string;
  createdAt:        string;
  updatedAt:        string;
};

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DeploymentStatus, {
  label: string; color: string; bg: string;
  Icon: React.FC<{ size?: number }>;
}> = {
  draft:            { label: "Draft",            color: "#6b7280", bg: "rgba(107,114,128,0.12)", Icon: ({ size=10 }) => <Clock size={size} /> },
  preview_ready:    { label: "Preview Ready",    color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  Icon: ({ size=10 }) => <Eye size={size} /> },
  domain_pending:   { label: "Domain Pending",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)", Icon: ({ size=10 }) => <Globe size={size} /> },
  dns_pending:      { label: "DNS Pending",      color: "#f97316", bg: "rgba(249,115,22,0.12)", Icon: ({ size=10 }) => <Wifi size={size} /> },
  ssl_pending:      { label: "SSL Pending",      color: "#a855f7", bg: "rgba(168,85,247,0.12)", Icon: ({ size=10 }) => <Shield size={size} /> },
  live:             { label: "Live",             color: "#22c55e", bg: "rgba(34,197,94,0.12)",  Icon: ({ size=10 }) => <CheckCircle size={size} /> },
  update_available: { label: "Update Available", color: "#06b6d4", bg: "rgba(6,182,212,0.12)",  Icon: ({ size=10 }) => <Zap size={size} /> },
  publish_failed:   { label: "Publish Failed",   color: "#ef4444", bg: "rgba(239,68,68,0.12)",  Icon: ({ size=10 }) => <AlertTriangle size={size} /> },
};

function StatusBadge({ status }: { status: DeploymentStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      padding: "0.2rem 0.6rem", borderRadius: "999px",
      fontSize: "0.6875rem", fontWeight: 700,
      color: cfg.color, backgroundColor: cfg.bg,
      border: `1px solid ${cfg.color}30`, whiteSpace: "nowrap",
    }}>
      <cfg.Icon size={9} />
      {cfg.label}
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls = "w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors flex-shrink-0"
    >
      {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
    </button>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }} transition={{ duration: 0.18 }}
            className="relative w-full max-w-lg glass-card rounded-2xl border border-riden-border z-10"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-riden-border">
              <h2 className="text-base font-semibold text-white">{title}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Domain Assignment Modal ───────────────────────────────────────────────────

function DomainModal({ site, onClose, onSaved }: { site: Site; onClose: () => void; onSaved: () => void }) {
  const [apex,      setApex]      = useState(site.apexDomain ?? "");
  const [www,       setWww]       = useState(site.wwwDomain  ?? "");
  const [target,    setTarget]    = useState(site.publishTarget ?? "both");
  const [createDns, setCreateDns] = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [result,    setResult]    = useState<string | null>(null);
  const [error,     setError]     = useState("");

  useEffect(() => {
    if (apex && !site.wwwDomain) setWww(`www.${apex}`);
  }, [apex, site.wwwDomain]);

  async function save() {
    if (!apex) { setError("Root domain is required."); return; }
    setSaving(true); setError(""); setResult(null);
    const res = await fetch("/api/deploy/domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId: site.id, apexDomain: apex, wwwDomain: www, publishTarget: target, createDns }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Failed."); return; }
    const lines: string[] = [];
    if (Array.isArray(data.dnsResults)) lines.push(...data.dnsResults);
    if (data.nextStep) lines.push("", data.nextStep);
    setResult(lines.join("\n"));
    setTimeout(() => { onSaved(); onClose(); }, 3500);
  }

  return (
    <Modal open title={site.liveDomain ? "Manage Domain" : "Assign Domain"} onClose={onClose}>
      <div className="p-5 space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Root Domain <span className="text-rose-400">*</span></label>
          <input className={inputCls} placeholder="clientdomain.co.uk" value={apex}
            onChange={e => setApex(e.target.value.toLowerCase().trim())} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">WWW Domain</label>
          <input className={inputCls} placeholder={`www.${apex || "clientdomain.co.uk"}`} value={www}
            onChange={e => setWww(e.target.value.toLowerCase().trim())} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Publish Target</label>
          <select className={inputCls} value={target} onChange={e => setTarget(e.target.value)}>
            <option value="both">Both (root + www)</option>
            <option value="root">Root domain only</option>
            <option value="www">WWW only</option>
          </select>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={createDns} onChange={e => setCreateDns(e.target.checked)}
            className="w-4 h-4 rounded border-riden-border accent-blue-500" />
          <span className="text-xs text-slate-300">Auto-create Cloudflare DNS records</span>
        </label>
        <p className="text-[11px] text-slate-500">
          Requires <code className="text-slate-400">CLOUDFLARE_API_TOKEN</code> env var and domain managed by Cloudflare nameservers.
        </p>
        {error  && <p className="text-xs text-rose-400">{error}</p>}
        {result && (
          <pre className="text-xs text-green-400 whitespace-pre-wrap bg-green-500/5 border border-green-500/20 rounded-xl p-3">
            {result}
          </pre>
        )}
      </div>
      <div className="flex gap-3 px-5 py-4 border-t border-riden-border">
        <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="gradient" className="flex-1" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save Domain"}
        </Button>
      </div>
    </Modal>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────

function ConfirmModal({ open, title, description, confirmLabel, danger = false, onClose, onConfirm }: {
  open: boolean; title: string; description: string; confirmLabel: string;
  danger?: boolean; onClose: () => void; onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="p-5">
        <p className="text-sm text-slate-300 leading-relaxed">{description}</p>
      </div>
      <div className="flex gap-3 px-5 py-4 border-t border-riden-border">
        <Button variant="outline" className="flex-1" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button
          variant={danger ? "destructive" : "gradient"}
          className="flex-1"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try { await onConfirm(); } finally { setBusy(false); onClose(); }
          }}
        >
          {busy ? "Working…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

// ── DNS Status Modal ──────────────────────────────────────────────────────────

function DnsModal({ site, onClose, onRefresh }: { site: Site; onClose: () => void; onRefresh: () => void }) {
  const [checking, setChecking] = useState(false);
  const [data,     setData]     = useState<Record<string, unknown> | null>(null);

  const check = useCallback(async () => {
    setChecking(true);
    const res = await fetch(`/api/deploy/dns-status?siteId=${site.id}`);
    setData(await res.json());
    setChecking(false);
    onRefresh();
  }, [site.id, onRefresh]);

  useEffect(() => { check(); }, [check]);

  const cnameTarget = "cname.vercel-dns.com";

  return (
    <Modal open title="DNS & SSL Status" onClose={onClose}>
      <div className="p-5 space-y-4">
        <div className="flex gap-4 text-xs text-slate-400">
          {site.apexDomain && <span>Apex: <span className="text-white font-mono">{site.apexDomain}</span></span>}
          {site.wwwDomain  && <span>WWW: <span className="text-white font-mono">{site.wwwDomain}</span></span>}
        </div>
        <p className="text-[11px] text-slate-500">CNAME target: <span className="text-slate-300 font-mono">{cnameTarget}</span></p>

        {data && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "DNS",  val: String(data.dnsStatus ?? "—"),  active: data.dnsStatus === "active" },
                { label: "SSL",  val: String(data.sslStatus ?? "—"),  active: data.sslStatus === "active" },
              ].map(s => (
                <div key={s.label} className="bg-riden-muted rounded-xl p-3 text-center">
                  <div className="text-xs text-slate-400 mb-1">{s.label}</div>
                  <div className={`text-sm font-bold uppercase ${s.active ? "text-green-400" : "text-amber-400"}`}>{s.val}</div>
                </div>
              ))}
            </div>

            {typeof data.dnsChecks === "object" && data.dnsChecks !== null && (
              <div className="space-y-1.5">
                {Object.entries(data.dnsChecks as Record<string, boolean>).map(([host, found]) => (
                  <div key={host} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-300">{host}</span>
                    <span className={found ? "text-green-400" : "text-rose-400"}>{found ? "✓ Record found" : "✗ Not found"}</span>
                  </div>
                ))}
              </div>
            )}
            {!!data.error && <p className="text-xs text-rose-400">{String(data.error as string)}</p>}
          </div>
        )}

        {!site.cloudflareZoneId && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 space-y-1.5">
            <p className="font-semibold">Manual DNS Setup Required</p>
            <p className="text-amber-400/70">Create these records in your DNS provider:</p>
            {site.apexDomain && <p className="font-mono">CNAME  {site.apexDomain}  →  {cnameTarget}</p>}
            {site.wwwDomain  && <p className="font-mono">CNAME  {site.wwwDomain}   →  {cnameTarget}</p>}
          </div>
        )}
      </div>
      <div className="flex gap-3 px-5 py-4 border-t border-riden-border">
        <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
        <Button variant="gradient" className="flex-1" onClick={check} disabled={checking}>
          <RefreshCw size={13} className={checking ? "animate-spin" : ""} />
          {checking ? "Checking…" : "Refresh Now"}
        </Button>
      </div>
    </Modal>
  );
}

// ── Site Card ─────────────────────────────────────────────────────────────────

function SiteCard({ site, onAction }: { site: Site; onAction: (a: string, s: Site) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos,  setMenuPos]  = useState({ top: 0, right: 0 });
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const status = (site.deploymentStatus ?? "preview_ready") as DeploymentStatus;
  const isLive = status === "live" || status === "update_available";

  const menuItems = [
    { label: "Preview Site",   action: "preview",   show: true },
    { label: "View Live Site", action: "view_live", show: isLive },
    { label: "Copy Live URL",  action: "copy_url",  show: isLive },
    { label: "Assign Domain",  action: "assign",    show: !isLive },
    { label: "Manage Domain",  action: "manage",    show: !!site.liveDomain },
    { label: "Check DNS/SSL",  action: "dns",       show: !!site.liveDomain },
    { label: "Push Updates",   action: "push",      show: status === "update_available" },
    { label: "Unpublish",      action: "unpublish", show: isLive, danger: true },
    { label: "Delete Website", action: "delete",    show: true,   danger: true },
  ].filter(i => i.show);

  function openMenu() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    }
    setMenuOpen(true);
  }

  return (
    <div className="glass-card rounded-2xl border border-riden-border hover:border-white/10 transition-all">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-riden-border/50">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{site.businessName}</div>
            <div className="text-xs text-slate-500 truncate mt-0.5">
              {site.clientName}{site.industry ? ` · ${site.industry}` : ""}
            </div>
          </div>
          <div className="flex-shrink-0">
            <button ref={btnRef} onClick={openMenu}
              className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && typeof document !== "undefined" && createPortal(
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div
                  className="fixed z-50 w-44 glass-card rounded-xl border border-riden-border overflow-hidden shadow-2xl"
                  style={{ top: menuPos.top, right: menuPos.right }}
                >
                  {menuItems.map(item => (
                    <button key={item.action}
                      onClick={() => { setMenuOpen(false); onAction(item.action, site); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-riden-muted ${(item as {danger?: boolean}).danger ? "text-rose-400" : "text-slate-300 hover:text-white"}`}>
                      {(item as {danger?: boolean}).danger && <AlertTriangle size={10} />}
                      {item.label}
                    </button>
                  ))}
                </div>
              </>,
              document.body
            )}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* URLs */}
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Eye size={11} className="text-slate-600 flex-shrink-0" />
          <a href={site.previewUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-400 font-mono truncate hover:text-blue-300 transition-colors min-w-0">
            {site.previewUrl?.replace("https://", "")}
          </a>
          <CopyBtn text={site.previewUrl} />
        </div>
        {site.liveDomain && (
          <div className="flex items-center gap-1.5 min-w-0">
            <Globe size={11} className={`flex-shrink-0 ${isLive ? "text-green-400" : "text-slate-600"}`} />
            <a href={`https://${site.liveDomain}`} target="_blank" rel="noopener noreferrer"
              className={`text-xs font-mono truncate hover:opacity-80 transition-opacity min-w-0 ${isLive ? "text-green-400" : "text-slate-400"}`}>
              {site.liveDomain}
            </a>
            <CopyBtn text={`https://${site.liveDomain}`} />
          </div>
        )}
      </div>

      {/* Status row */}
      {site.liveDomain && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
            <span>DNS: <span className={site.dnsStatus === "active" ? "text-green-400" : "text-amber-400"}>{site.dnsStatus ?? "—"}</span></span>
            <span>SSL: <span className={site.sslStatus === "active" ? "text-green-400" : "text-amber-400"}>{site.sslStatus ?? "—"}</span></span>
            {site.lastPublishedAt && <span className="ml-auto">Published {fmtDate(site.lastPublishedAt)}</span>}
          </div>
          {site.deploymentError && (
            <p className="text-[11px] text-rose-400 mt-1 truncate" title={site.deploymentError}>{site.deploymentError}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="text-xs"
          onClick={() => window.open(site.previewUrl, "_blank")}>
          <Eye size={12} /> Preview
        </Button>

        {!site.liveDomain && (
          <Button variant="outline" size="sm" className="text-xs flex-1"
            onClick={() => onAction("assign", site)}>
            <Globe size={12} /> Assign Domain
          </Button>
        )}

        {site.liveDomain && !isLive && (
          <Button variant="gradient" size="sm" className="text-xs flex-1"
            onClick={() => onAction("publish", site)}>
            <CloudUpload size={12} /> Publish Live
          </Button>
        )}

        {isLive && (
          <Button variant="outline" size="sm" className="text-xs flex-1"
            onClick={() => window.open(`https://${site.liveDomain}`, "_blank")}>
            <ExternalLink size={12} /> View Live
          </Button>
        )}

        {status === "update_available" && (
          <Button variant="gradient" size="sm" className="text-xs"
            onClick={() => onAction("push", site)}>
            <Zap size={12} /> Push
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WebsitesPage() {
  const [sites,   setSites]   = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [domainSite, setDomainSite] = useState<Site | null>(null);
  const [dnsSite,    setDnsSite]    = useState<Site | null>(null);
  const [confirm,    setConfirm]    = useState<{
    open: boolean; title: string; description: string; confirmLabel: string;
    danger?: boolean; action: () => Promise<void>;
  } | null>(null);

  const fetchSites = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/generated-sites");
      const data = await res.json();
      setSites(Array.isArray(data) ? data : []);
    } catch { setSites([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSites(); }, [fetchSites]);

  async function handleAction(action: string, site: Site) {
    if (action === "preview")   { window.open(site.previewUrl, "_blank"); return; }
    if (action === "view_live") { window.open(`https://${site.liveDomain}`, "_blank"); return; }
    if (action === "copy_url")  { await navigator.clipboard.writeText(`https://${site.liveDomain}`); return; }
    if (action === "assign" || action === "manage") { setDomainSite(site); return; }
    if (action === "dns")       { setDnsSite(site); return; }

    if (action === "publish") {
      setConfirm({
        open: true,
        title: "Publish Live",
        description: `Publish ${site.businessName} to ${site.liveDomain ?? site.apexDomain}? Make sure DNS records are pointing to the hosting provider.`,
        confirmLabel: "Publish Live",
        action: async () => {
          const res = await fetch("/api/deploy/publish", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ siteId: site.id }),
          });
          if (res.ok) {
            await fetchSites();
            // Auto-check DNS/SSL after a short delay so the status updates immediately
            setTimeout(async () => {
              await fetch(`/api/deploy/dns-status?siteId=${site.id}`);
              await fetchSites();
              setDnsSite(site);
            }, 3000);
          }
        },
      });
      return;
    }

    if (action === "push") {
      setConfirm({
        open: true,
        title: "Push Updates",
        description: `Push the latest changes to ${site.businessName} at ${site.liveDomain}. The domain and DNS records remain unchanged.`,
        confirmLabel: "Push Updates",
        action: async () => {
          const res = await fetch("/api/deploy/push", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ siteId: site.id }),
          });
          if (res.ok) await fetchSites();
        },
      });
      return;
    }

    if (action === "unpublish") {
      setConfirm({
        open: true, danger: true,
        title: "Unpublish Website",
        description: `Take ${site.businessName} offline? The preview link will still work. DNS records are not removed automatically.`,
        confirmLabel: "Unpublish",
        action: async () => {
          await fetch("/api/deploy/unpublish", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ siteId: site.id }),
          });
          await fetchSites();
        },
      });
      return;
    }

    if (action === "delete") {
      setConfirm({
        open: true, danger: true,
        title: "Delete Website",
        description: `Permanently delete ${site.businessName}? This cannot be undone. DNS records must be removed manually.`,
        confirmLabel: "Delete Permanently",
        action: async () => {
          await fetch(`/api/generated-sites/${site.id}`, { method: "DELETE" });
          await fetchSites();
        },
      });
    }
  }

  const liveCount    = sites.filter(s => s.deploymentStatus === "live" || s.deploymentStatus === "update_available").length;
  const previewCount = sites.filter(s => !s.deploymentStatus || s.deploymentStatus === "preview_ready").length;
  const pendingCount = sites.filter(s => ["domain_pending","dns_pending","ssl_pending"].includes(s.deploymentStatus)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Website Studio</h2>
          <p className="text-sm text-slate-500">{sites.length} website{sites.length !== 1 ? "s" : ""} · {liveCount} live</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSites}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Sites",   value: sites.length,  color: "#6b7280" },
          { label: "Live",          value: liveCount,     color: "#22c55e" },
          { label: "Preview Ready", value: previewCount,  color: "#3b82f6" },
          { label: "Pending",       value: pendingCount,  color: "#f59e0b" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-card rounded-xl border border-riden-border p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {!loading && sites.length === 0 && (
        <div className="glass-card rounded-xl border border-riden-border p-12 text-center">
          <Globe size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No generated websites yet</p>
          <p className="text-sm text-slate-500 mb-4">Generate your first website from the Projects tab using the Website Brief.</p>
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-riden-muted rounded-xl px-4 py-2">
            <span>Projects</span>
            <ChevronRight size={12} />
            <span>Website Brief tab</span>
            <ChevronRight size={12} />
            <span>Generate Website</span>
          </div>
        </div>
      )}

      {/* Site cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl border border-riden-border overflow-hidden animate-pulse">
                <div className="h-20 bg-riden-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-32 rounded bg-riden-muted" />
                  <div className="h-3 w-24 rounded bg-riden-muted" />
                  <div className="h-3 w-40 rounded bg-riden-muted" />
                </div>
              </div>
            ))
          : sites.map((site, i) => (
              <motion.div key={site.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}>
                <SiteCard site={site} onAction={handleAction} />
              </motion.div>
            ))
        }
      </div>

      {/* Modals */}
      {domainSite && (
        <DomainModal site={domainSite} onClose={() => setDomainSite(null)} onSaved={fetchSites} />
      )}
      {dnsSite && (
        <DnsModal site={dnsSite} onClose={() => setDnsSite(null)} onRefresh={fetchSites} />
      )}
      {confirm && (
        <ConfirmModal
          open={confirm.open}
          title={confirm.title}
          description={confirm.description}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          onClose={() => setConfirm(null)}
          onConfirm={confirm.action}
        />
      )}
    </div>
  );
}
