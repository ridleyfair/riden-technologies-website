"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, X, RefreshCw, CheckCircle, AlertTriangle,
  ExternalLink, Phone, Globe, MapPin, Star, Flame, Loader2,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LeadScore = {
  total_score: number;
  lead_tier: string;
};

type Business = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews_count: number | null;
  maps_url: string | null;
  is_facebook_only: boolean;
  website_analyzed: boolean;
  created_at: string;
  lead_score: LeadScore | null;
};

type ScrapeJob = {
  id: string;
  status: string;
  city: string;
  keyword: string;
  businesses_found: number;
  businesses_scored: number;
};

type Toast = { msg: string; type: "success" | "error" };

const TIER_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  hot:  { label: "Hot",  dot: "bg-rose-500",   text: "text-rose-400",   bg: "bg-rose-500/10 border-rose-500/20" },
  warm: { label: "Warm", dot: "bg-amber-400",  text: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20" },
  cool: { label: "Cool", dot: "bg-blue-400",   text: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  cold: { label: "Cold", dot: "bg-slate-500",  text: "text-slate-400",  bg: "bg-slate-500/10 border-slate-500/20" },
};

function TierBadge({ tier, score }: { tier: string; score: number }) {
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.cold;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border", cfg.bg, cfg.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label} · {score}
    </span>
  );
}

function ScrapeModal({
  onClose,
  onStart,
  loading,
}: {
  onClose: () => void;
  onStart: (city: string, keyword: string, maxResults: number, source: string) => void;
  loading: boolean;
}) {
  const [city, setCity] = useState("");
  const [keyword, setKeyword] = useState("");
  const [maxResults, setMaxResults] = useState(100);
  const [source, setSource] = useState("google_maps");

  const keywordPlaceholder = source === "checkatrade"
    ? "e.g. Plumber, Electrician, Roofer"
    : "e.g. plumbers, electricians, roofers";

  const keywordLabel = source === "checkatrade" ? "Trade type" : "Keyword";

  return (
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
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-md glass-card rounded-2xl border border-riden-border p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Search size={18} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white">New Scrape</h3>
            <p className="text-xs text-slate-500">Find potential clients with no website</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Source selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Source</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "google_maps", label: "Google Maps" },
                { value: "checkatrade", label: "Checkatrade" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSource(opt.value)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                    source === opt.value
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                      : "bg-riden-muted border-riden-border text-slate-400 hover:text-white"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Location</label>
            <input
              type="text"
              placeholder="e.g. Manchester"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-riden-muted border border-riden-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">{keywordLabel}</label>
            <input
              type="text"
              placeholder={keywordPlaceholder}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full bg-riden-muted border border-riden-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
            />
            {source === "checkatrade" && (
              <p className="text-xs text-slate-500 mt-1">
                Use the Checkatrade trade category, e.g. &quot;Plumber&quot; not &quot;plumbers&quot;
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Max results</label>
            <select
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="w-full bg-riden-muted border border-riden-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-riden-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onStart(city.trim(), keyword.trim(), maxResults, source)}
            disabled={loading || !city.trim() || !keyword.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {loading ? "Starting..." : "Start Scrape"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function PossibleClientsView() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [tier, setTier] = useState("");
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(false);

  const [scrapeModal, setScrapeModal] = useState(false);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [activeJob, setActiveJob] = useState<ScrapeJob | null>(null);

  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [importingId, setImportingId] = useState<string | null>(null);

  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, type: Toast["type"]) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchBusinesses = useCallback(async (p = page) => {
    setLoading(true);
    setOffline(false);
    try {
      const params = new URLSearchParams({ page: String(p), page_size: String(PAGE_SIZE) });
      if (city) params.set("city", city);
      if (category) params.set("category", category);
      if (tier) params.set("lead_tier", tier);
      if (noWebsiteOnly) params.set("has_website", "false");

      const res = await fetch(`/api/possible-clients?${params}`);
      if (res.status === 503) { setOffline(true); setBusinesses([]); return; }
      if (!res.ok) return;
      const data = await res.json();
      setBusinesses(data.items ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, city, category, tier, noWebsiteOnly]);

  useEffect(() => {
    fetchBusinesses(page);
  }, [page, city, category, tier, noWebsiteOnly]);

  // Poll active scrape job
  useEffect(() => {
    if (!activeJob || activeJob.status === "completed" || activeJob.status === "failed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/possible-clients/scrape/${activeJob.id}`);
        if (!res.ok) return;
        const job: ScrapeJob = await res.json();
        setActiveJob(job);
        if (job.status === "completed" || job.status === "failed") {
          if (job.status === "completed") {
            showToast(`Scrape complete — ${job.businesses_found} businesses found`, "success");
            fetchBusinesses(1);
            setPage(1);
          } else {
            showToast("Scrape failed. Check the scraper logs.", "error");
          }
        }
      } catch {
        // ignore polling errors
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeJob?.id, activeJob?.status]);

  const handleStartScrape = async (scrapeCity: string, keyword: string, maxResults: number, source: string) => {
    setScrapeLoading(true);
    try {
      const res = await fetch("/api/possible-clients/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: scrapeCity, keyword, category: keyword, max_results: maxResults, source }),
      });
      if (res.status === 503) { showToast("Scraper is offline. Start the FastAPI server.", "error"); return; }
      if (!res.ok) { showToast("Failed to start scrape.", "error"); return; }
      const job: ScrapeJob = await res.json();
      setActiveJob(job);
      setScrapeModal(false);
      showToast(`Scrape started — searching "${keyword}" in ${scrapeCity}`, "success");
    } catch {
      showToast("Could not reach scraper.", "error");
    } finally {
      setScrapeLoading(false);
    }
  };

  const handleImport = async (business: Business) => {
    setImportingId(business.id);
    try {
      const res = await fetch(`/api/possible-clients/${business.id}/import`, { method: "POST" });
      if (!res.ok) { showToast("Failed to import — try again.", "error"); return; }
      setImportedIds((prev) => new Set(prev).add(business.id));
      showToast(`${business.name} added to CRM Leads`, "success");
    } catch {
      showToast("Import failed.", "error");
    } finally {
      setImportingId(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hotCount = businesses.filter((b) => b.lead_score?.lead_tier === "hot").length;
  const warmCount = businesses.filter((b) => b.lead_score?.lead_tier === "warm").length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-riden-border flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-white">Possible Clients</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Businesses scraped from Google Maps — no or weak website
          </p>
        </div>
        <button
          onClick={() => setScrapeModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          Run Scrape
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        {/* Offline banner */}
        {offline && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <WifiOff size={16} className="flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium">Scraper offline.</span>{" "}
              Start the FastAPI server, then set{" "}
              <code className="text-xs bg-rose-500/20 px-1 rounded">SCRAPER_API_URL</code> in your env.
            </div>
          </div>
        )}

        {/* Active job banner */}
        <AnimatePresence>
          {activeJob && activeJob.status !== "completed" && activeJob.status !== "failed" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"
            >
              <Loader2 size={15} className="text-blue-400 animate-spin flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">
                  Scraping &ldquo;{activeJob.keyword}&rdquo; in {activeJob.city}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 capitalize">
                  Status: {activeJob.status}
                  {activeJob.businesses_found > 0 && ` · ${activeJob.businesses_found} found so far`}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats row */}
        {!offline && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total scraped", value: total, color: "text-white" },
              { label: "Hot leads", value: businesses.filter(b => b.lead_score?.lead_tier === "hot").length, color: "text-rose-400" },
              { label: "Warm leads", value: businesses.filter(b => b.lead_score?.lead_tier === "warm").length, color: "text-amber-400" },
              { label: "No website", value: businesses.filter(b => !b.website).length, color: "text-violet-400" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-xl border border-riden-border p-4">
                <div className={cn("text-2xl font-bold", stat.color)}>{stat.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[140px]">
            <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by city..."
              value={city}
              onChange={(e) => { setCity(e.target.value); setPage(1); }}
              className="w-full pl-8 pr-3 py-2 bg-riden-muted border border-riden-border rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="relative flex-1 min-w-[140px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by category..."
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="w-full pl-8 pr-3 py-2 bg-riden-muted border border-riden-border rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <select
            value={tier}
            onChange={(e) => { setTier(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-riden-muted border border-riden-border rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="">All tiers</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cool">Cool</option>
            <option value="cold">Cold</option>
          </select>
          <button
            onClick={() => { setNoWebsiteOnly((v) => !v); setPage(1); }}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
              noWebsiteOnly
                ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                : "bg-riden-muted border-riden-border text-slate-400 hover:text-white"
            )}
          >
            No website only
          </button>
          <button
            onClick={() => fetchBusinesses(page)}
            className="p-2 rounded-lg bg-riden-muted border border-riden-border text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={cn(loading && "animate-spin")} />
          </button>
        </div>

        {/* Table */}
        <div className="glass-card rounded-xl border border-riden-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-slate-600" />
            </div>
          ) : businesses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-riden-muted border border-riden-border flex items-center justify-center mb-3">
                <Flame size={20} className="text-slate-600" />
              </div>
              <p className="text-sm text-slate-400 font-medium">No businesses yet</p>
              <p className="text-xs text-slate-600 mt-1">
                {offline ? "Start the scraper to begin" : "Run a scrape to find potential clients"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-riden-border">
                    {["Business", "City", "Category", "Rating", "Phone", "Website", "Tier", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {businesses.map((b, i) => {
                    const isImported = importedIds.has(b.id);
                    const isImporting = importingId === b.id;
                    return (
                      <motion.tr
                        key={b.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-riden-border/50 hover:bg-riden-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-white max-w-[180px] truncate">{b.name}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{b.city ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-400">{b.category ?? "—"}</td>
                        <td className="px-4 py-3">
                          {b.rating != null ? (
                            <span className="flex items-center gap-1 text-amber-400">
                              <Star size={12} fill="currentColor" />
                              {b.rating.toFixed(1)}
                              <span className="text-slate-500 text-xs">({b.reviews_count ?? 0})</span>
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {b.phone ? (
                            <a
                              href={`tel:${b.phone}`}
                              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
                            >
                              <Phone size={11} />
                              {b.phone}
                            </a>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {b.website ? (
                            <a
                              href={b.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors max-w-[140px] truncate"
                            >
                              <Globe size={11} className="flex-shrink-0" />
                              <span className="truncate">{b.website.replace(/^https?:\/\//, "")}</span>
                              <ExternalLink size={10} className="flex-shrink-0" />
                            </a>
                          ) : (
                            <span className="text-rose-400/70 text-xs">No website</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {b.lead_score ? (
                            <TierBadge tier={b.lead_score.lead_tier} score={b.lead_score.total_score} />
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {b.maps_url && (
                              <a
                                href={b.maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-riden-muted transition-colors"
                                title="View on Google Maps"
                              >
                                <MapPin size={13} />
                              </a>
                            )}
                            <button
                              onClick={() => !isImported && handleImport(b)}
                              disabled={isImporting || isImported}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 whitespace-nowrap",
                                isImported
                                  ? "bg-green-500/10 border-green-500/20 text-green-400 cursor-default"
                                  : "bg-riden-muted border-riden-border text-slate-300 hover:text-white hover:border-blue-500/40 hover:bg-blue-500/10 disabled:opacity-50"
                              )}
                            >
                              {isImporting ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : isImported ? (
                                <CheckCircle size={11} />
                              ) : (
                                <Plus size={11} />
                              )}
                              {isImported ? "Added" : "Add to CRM"}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs bg-riden-muted border border-riden-border text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs bg-riden-muted border border-riden-border text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scrape modal */}
      <AnimatePresence>
        {scrapeModal && (
          <ScrapeModal
            onClose={() => setScrapeModal(false)}
            onStart={handleStartScrape}
            loading={scrapeLoading}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className={cn(
              "fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium",
              toast.type === "success"
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            )}
          >
            {toast.type === "success" ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
