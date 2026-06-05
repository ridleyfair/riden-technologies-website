"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, X, RefreshCw, CheckCircle, AlertTriangle,
  ExternalLink, Phone, Globe, MapPin, Star, Flame, Loader2,
  WifiOff, BadgeCheck, HelpCircle, ClipboardCopy, Zap, Mail,
} from "lucide-react";
import { buildWebsitePreviewEmail, openEmailCompose } from "@/lib/email-outreach";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

type LeadScore = { total_score: number; lead_tier: string };

type Business = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  rating: number | null;
  reviews_count: number | null;
  maps_url: string | null;
  place_id: string | null;
  is_facebook_only: boolean;
  website_analyzed: boolean;
  created_at: string;
  lead_score: LeadScore | null;
};

type CheckatradeEnrichment = {
  business_id: string;
  has_checkatrade: boolean;
  checkatrade_url: string | null;
  checkatrade_rating: number | null;
  checkatrade_review_count: number;
  checkatrade_category: string | null;
  checkatrade_location: string | null;
  checkatrade_phone: string | null;
  match_confidence: string;
  opportunity_score: number;
  checked_at: string;
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

// ── Helpers ────────────────────────────────────────────────────────────────────

function getSource(b: Business): "google_maps" | "checkatrade" {
  if (b.place_id) return "google_maps";
  if (b.maps_url?.includes("checkatrade.com")) return "checkatrade";
  return "google_maps";
}

function opportunityTier(score: number): { label: string; bg: string; text: string } {
  if (score >= 70) return { label: "Hot Lead",  bg: "bg-rose-500/10 border-rose-500/20",   text: "text-rose-400" };
  if (score >= 50) return { label: "Warm Lead", bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400" };
  if (score >= 30) return { label: "Good Lead", bg: "bg-blue-500/10 border-blue-500/20",   text: "text-blue-400" };
  return            { label: "Cold",      bg: "bg-slate-500/10 border-slate-500/20",  text: "text-slate-500" };
}

function buildOutreachMessage(business: Business, enrichment: CheckatradeEnrichment): string {
  const reviews = enrichment.checkatrade_review_count > 0
    ? `${enrichment.checkatrade_review_count} reviews` + (enrichment.checkatrade_rating ? ` and a ${enrichment.checkatrade_rating}/10 rating` : "")
    : "great reviews";
  return `Hi there,

I came across ${business.name} on Checkatrade — with ${reviews}, it's clear you do fantastic work!

I noticed you don't currently have a website, which means potential customers might struggle to find your contact details online. We build professional websites for tradespeople that help you get found on Google and turn visitors into real enquiries.

Would you be open to a quick 10-minute chat about how we could help grow your business online?

Best regards`;
}

// ── Small components ───────────────────────────────────────────────────────────

function SourceBadge({ business }: { business: Business }) {
  if (getSource(business) === "checkatrade") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 border border-orange-500/20 text-orange-400">
        Checkatrade
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400">
      Google Maps
    </span>
  );
}

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

function CheckatradeCell({
  enrichment,
  isChecking,
  onCheck,
}: {
  enrichment: CheckatradeEnrichment | undefined;
  isChecking: boolean;
  onCheck: () => void;
}) {
  if (isChecking) {
    return (
      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
        <Loader2 size={12} className="animate-spin" />
        Checking…
      </div>
    );
  }

  if (!enrichment) {
    return (
      <button
        onClick={onCheck}
        className="px-2 py-1 rounded-md text-xs font-medium border border-riden-border bg-riden-muted text-slate-400 hover:text-white hover:border-orange-500/40 hover:bg-orange-500/10 transition-colors"
      >
        Check
      </button>
    );
  }

  // Checked — not found
  if (!enrichment.has_checkatrade && enrichment.match_confidence !== "possible") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-slate-600 text-xs">Not found</span>
        <button
          onClick={onCheck}
          className="p-0.5 rounded text-slate-600 hover:text-slate-400 transition-colors"
          title="Re-check"
        >
          <RefreshCw size={11} />
        </button>
      </div>
    );
  }

  // Possible match — needs review
  if (enrichment.match_confidence === "possible" && enrichment.checkatrade_url) {
    return (
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-yellow-500 text-xs">
            <HelpCircle size={11} />
            Possible match
          </div>
          <button onClick={onCheck} className="p-0.5 rounded text-slate-600 hover:text-slate-400 transition-colors" title="Re-check">
            <RefreshCw size={11} />
          </button>
        </div>
        <a
          href={enrichment.checkatrade_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
        >
          Review <ExternalLink size={9} />
        </a>
      </div>
    );
  }

  // Confirmed Checkatrade profile
  const conf = enrichment.match_confidence;
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5">
        <a
          href={enrichment.checkatrade_url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-orange-400 hover:text-orange-300 text-xs font-medium transition-colors"
        >
          <BadgeCheck size={12} />
          Checkatrade
          <ExternalLink size={9} />
        </a>
        {conf === "medium" && (
          <span className="text-xs text-yellow-600">~match</span>
        )}
        {conf === "low" && (
          <span className="text-xs text-orange-600">?low</span>
        )}
        <button onClick={onCheck} className="p-0.5 rounded text-slate-600 hover:text-slate-400 transition-colors" title="Re-check">
          <RefreshCw size={11} />
        </button>
      </div>
      {(enrichment.checkatrade_rating != null || enrichment.checkatrade_review_count > 0) && (
        <div className="flex items-center gap-1 text-amber-400 text-xs">
          <Star size={10} fill="currentColor" />
          {enrichment.checkatrade_rating != null
            ? `${enrichment.checkatrade_rating}/10`
            : "—"}
          {enrichment.checkatrade_review_count > 0 && (
            <span className="text-slate-500">· {enrichment.checkatrade_review_count} reviews</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Scrape modal data ──────────────────────────────────────────────────────────

const UK_AREAS = [
  "London", "Manchester", "Birmingham", "Leeds", "Liverpool", "Bristol",
  "Sheffield", "Edinburgh", "Glasgow", "Cardiff", "Newcastle upon Tyne",
  "Nottingham", "Leicester", "Coventry", "Brighton", "Southampton",
  "Portsmouth", "Reading", "Oxford", "Cambridge", "Plymouth", "Derby",
  "Stoke-on-Trent", "Wolverhampton", "Swansea", "Aberdeen", "Dundee",
  "Sunderland", "Milton Keynes", "Exeter", "Norwich", "Ipswich", "Luton",
  "Peterborough", "Northampton", "Middlesbrough", "Bolton", "Wigan",
  "Blackpool", "Blackburn", "Huddersfield", "Barnsley", "York", "Chester",
  "Doncaster", "Rotherham", "Stockport", "Salford", "Oldham", "Wakefield",
];

const GOOGLE_TRADES = [
  "plumbers", "electricians", "gas engineers", "roofers", "builders",
  "painters and decorators", "plasterers", "joiners", "carpenters",
  "kitchen fitters", "bathroom fitters", "tilers", "flooring specialists",
  "landscapers", "gardeners", "fencers", "tree surgeons",
  "driveway installers", "window fitters", "locksmiths",
  "drainage specialists", "pest control", "heating engineers",
  "boiler engineers", "solar panel installers", "loft conversion specialists",
  "extension builders", "groundworkers", "glaziers", "scaffolders",
];

const CHECKATRADE_TRADES = [
  "Plumber", "Electrician", "Gas Engineer", "Roofer", "Builder",
  "Painter & Decorator", "Plasterer", "Joiner", "Carpenter",
  "Kitchen Fitter", "Bathroom Fitter", "Tiler", "Flooring Specialist",
  "Landscaper", "Gardener", "Fencer", "Tree Surgeon",
  "Driveway Contractor", "Window Fitter", "Locksmith",
  "Drainage Specialist", "Pest Control Specialist", "Heating Engineer",
  "Boiler Engineer", "Solar Panel Installer", "Loft Conversion Specialist",
  "Extension Builder", "Groundworker", "Glazier", "Scaffolder",
];

const SELECT_CLASS =
  "w-full bg-riden-muted border border-riden-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20";
const INPUT_CLASS =
  "w-full bg-riden-muted border border-riden-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20";

// ── Scrape modal ───────────────────────────────────────────────────────────────

function ScrapeModal({
  onClose,
  onStart,
  loading,
}: {
  onClose: () => void;
  onStart: (city: string, keyword: string, maxResults: number, source: string) => void;
  loading: boolean;
}) {
  const [citySelect, setCitySelect] = useState("");
  const [cityCustom, setCityCustom] = useState("");
  const [keywordSelect, setKeywordSelect] = useState("");
  const [keywordCustom, setKeywordCustom] = useState("");
  const [maxResults, setMaxResults] = useState(100);
  const [source, setSource] = useState("google_maps");

  const city    = citySelect    === "__other__" ? cityCustom    : citySelect;
  const keyword = keywordSelect === "__other__" ? keywordCustom : keywordSelect;

  const trades = source === "checkatrade" ? CHECKATRADE_TRADES : GOOGLE_TRADES;
  const keywordLabel = source === "checkatrade" ? "Trade type" : "Keyword";

  // Reset keyword when source changes (lists are different)
  const handleSourceChange = (val: string) => {
    setSource(val);
    setKeywordSelect("");
    setKeywordCustom("");
  };

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
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Source */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Source</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "google_maps", label: "Google Maps" },
                { value: "checkatrade", label: "Checkatrade" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSourceChange(opt.value)}
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

          {/* Location */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Location</label>
            <select
              value={citySelect}
              onChange={(e) => setCitySelect(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">— Select area —</option>
              {UK_AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
              <option value="__other__">Other — type your own</option>
            </select>
            {citySelect === "__other__" && (
              <input
                type="text"
                placeholder="e.g. Bury St Edmunds"
                value={cityCustom}
                onChange={(e) => setCityCustom(e.target.value)}
                className={cn(INPUT_CLASS, "mt-2")}
                autoFocus
              />
            )}
          </div>

          {/* Trade / Keyword */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">{keywordLabel}</label>
            <select
              value={keywordSelect}
              onChange={(e) => setKeywordSelect(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">— Select trade —</option>
              {trades.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
              <option value="__other__">Other — type your own</option>
            </select>
            {keywordSelect === "__other__" && (
              <input
                type="text"
                placeholder={source === "checkatrade" ? "e.g. Flooring Fitter" : "e.g. solar panel installers"}
                value={keywordCustom}
                onChange={(e) => setKeywordCustom(e.target.value)}
                className={cn(INPUT_CLASS, "mt-2")}
                autoFocus
              />
            )}
          </div>

          {/* Max results */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Max results</label>
            <select
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className={SELECT_CLASS}
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
            {loading ? "Starting…" : "Start Scrape"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────────

export default function PossibleClientsView() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const PAGE_SIZE = 25;

  // Filters
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [tier, setTier] = useState("");
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("");
  const [hasCheckatradeFilter, setHasCheckatradeFilter] = useState(false);
  const [hotLeadsOnly, setHotLeadsOnly] = useState(false);

  // Scrape
  const [scrapeModal, setScrapeModal] = useState(false);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [activeJob, setActiveJob] = useState<ScrapeJob | null>(null);

  // Import
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [importingId, setImportingId] = useState<string | null>(null);

  // Checkatrade enrichment
  const [enrichments, setEnrichments] = useState<Record<string, CheckatradeEnrichment>>({});
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set());
  const [checkingAll, setCheckingAll] = useState(false);

  // Email scanning
  const [emailScanning,  setEmailScanning]  = useState(false);
  const [emailScanMsg,   setEmailScanMsg]   = useState<string | null>(null);
  const [emailScanProgress, setEmailScanProgress] = useState<{ done: number; total: number } | null>(null);

  // Toast
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, type: Toast["type"]) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Data fetching ────────────────────────────────────────────────────────────

  const buildFilterParams = useCallback(() => {
    const p = new URLSearchParams();
    if (city) p.set("city", city);
    if (category) p.set("category", category);
    if (tier) p.set("lead_tier", tier);
    if (noWebsiteOnly) p.set("has_website", "false");
    return p;
  }, [city, category, tier, noWebsiteOnly]);

  const loadEnrichments = useCallback(async (items: Business[]) => {
    if (items.length === 0) return;
    const map: Record<string, CheckatradeEnrichment> = {};
    const BATCH = 100;
    for (let i = 0; i < items.length; i += BATCH) {
      const ids = items.slice(i, i + BATCH).map((b) => b.id).join(",");
      const eRes = await fetch(`/api/possible-clients/enrichments?ids=${ids}`);
      if (eRes.ok) {
        const rows: CheckatradeEnrichment[] = await eRes.json();
        for (const row of rows) map[row.business_id] = row;
      }
    }
    setEnrichments(map);
  }, []);

  const fetchBusinesses = useCallback(
    async (p = page) => {
      setLoading(true);
      setOffline(false);
      try {
        const params = buildFilterParams();
        params.set("page", String(p));
        params.set("page_size", String(PAGE_SIZE));

        const res = await fetch(`/api/possible-clients?${params}`);
        if (res.status === 503) { setOffline(true); setBusinesses([]); return; }
        if (!res.ok) return;
        const data = await res.json();
        const items: Business[] = data.items ?? [];
        setBusinesses(items);
        setTotal(data.total ?? 0);
        await loadEnrichments(items);
      } finally {
        setLoading(false);
      }
    },
    [page, buildFilterParams, loadEnrichments]
  );

  const fetchAllBusinesses = useCallback(async () => {
    setLoading(true);
    setOffline(false);
    const CHUNK = 200; // Railway's max page_size
    try {
      const firstParams = buildFilterParams();
      firstParams.set("page", "1");
      firstParams.set("page_size", String(CHUNK));

      const firstRes = await fetch(`/api/possible-clients?${firstParams}`);
      if (firstRes.status === 503) { setOffline(true); setBusinesses([]); return; }
      if (!firstRes.ok) return;
      const firstData = await firstRes.json();
      const totalCount: number = firstData.total ?? 0;
      let allItems: Business[] = firstData.items ?? [];
      setTotal(totalCount);

      // Fetch remaining pages in parallel if total exceeds one chunk
      const totalPages = Math.ceil(totalCount / CHUNK);
      if (totalPages > 1) {
        const pagePromises = Array.from({ length: totalPages - 1 }, (_, i) => {
          const params = buildFilterParams();
          params.set("page", String(i + 2));
          params.set("page_size", String(CHUNK));
          return fetch(`/api/possible-clients?${params}`).then((r) => r.json());
        });
        const results = await Promise.all(pagePromises);
        for (const r of results) allItems = allItems.concat(r.items ?? []);
      }

      setBusinesses(allItems);
      await loadEnrichments(allItems);
    } finally {
      setLoading(false);
    }
  }, [buildFilterParams, loadEnrichments]);

  useEffect(() => {
    if (showAll) fetchAllBusinesses();
    else fetchBusinesses(page);
  // fetchAllBusinesses and fetchBusinesses are stable useCallback refs; omitting them
  // avoids an infinite re-render loop while keeping all real filter/page deps.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, showAll, city, category, tier, noWebsiteOnly]);

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
      } catch { /* ignore */ }
    }, 4000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJob?.id, activeJob?.status]);

  // ── Scrape handlers ──────────────────────────────────────────────────────────

  const handleStartScrape = async (
    scrapeCity: string,
    keyword: string,
    maxResults: number,
    source: string
  ) => {
    setScrapeLoading(true);
    setScrapeModal(false);

    if (source === "checkatrade") {
      showToast(`Scraping Checkatrade for "${keyword}" in ${scrapeCity}…`, "success");
      try {
        const res = await fetch("/api/possible-clients/checkatrade-scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trade: keyword, location: scrapeCity, max_results: maxResults }),
        });
        if (res.status === 503) { showToast("Scraper is offline.", "error"); return; }
        if (!res.ok) { showToast("Checkatrade scrape failed.", "error"); return; }
        const result = await res.json();
        showToast(`Checkatrade done — ${result.saved ?? 0} new businesses saved`, "success");
        fetchBusinesses(1);
        setPage(1);
      } catch {
        showToast("Checkatrade scrape failed.", "error");
      } finally {
        setScrapeLoading(false);
      }
      return;
    }

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
      showToast(`Scrape started — searching "${keyword}" in ${scrapeCity}`, "success");
    } catch {
      showToast("Could not reach scraper.", "error");
    } finally {
      setScrapeLoading(false);
    }
  };

  // ── Import handler ───────────────────────────────────────────────────────────

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

  // ── Checkatrade lookup handlers ──────────────────────────────────────────────

  const handleCheckCheckatrade = useCallback(
    async (business: Business) => {
      setCheckingIds((prev) => new Set(prev).add(business.id));
      try {
        const res = await fetch(`/api/possible-clients/${business.id}/checkatrade-lookup`, {
          method: "POST",
        });
        if (!res.ok) {
          showToast(`Checkatrade lookup failed for ${business.name}`, "error");
          return;
        }
        const enrichment: CheckatradeEnrichment & { email?: string } = await res.json();
        setEnrichments((prev) => ({ ...prev, [business.id]: enrichment }));
        // If the lookup found an email, update the business row immediately
        if (enrichment.email && !business.email) {
          setBusinesses((prev) =>
            prev.map((b) => b.id === business.id ? { ...b, email: enrichment.email! } : b)
          );
        }
      } catch {
        showToast("Checkatrade lookup failed.", "error");
      } finally {
        setCheckingIds((prev) => {
          const next = new Set(prev);
          next.delete(business.id);
          return next;
        });
      }
    },
    [showToast]
  );

  const handleCheckAll = useCallback(async () => {
    // Include "not found" results so they get a second chance with the improved search
    const unchecked = businesses.filter(
      (b) => !checkingIds.has(b.id) && (!enrichments[b.id] || !enrichments[b.id].has_checkatrade)
    );
    if (unchecked.length === 0) {
      showToast("All businesses on this page already have Checkatrade profiles", "success");
      return;
    }
    setCheckingAll(true);
    const CONCURRENCY = 3;
    for (let i = 0; i < unchecked.length; i += CONCURRENCY) {
      const batch = unchecked.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map((b) => handleCheckCheckatrade(b)));
      if (i + CONCURRENCY < unchecked.length) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }
    setCheckingAll(false);
    showToast(`Checked ${unchecked.length} businesses for Checkatrade`, "success");
  }, [businesses, enrichments, checkingIds, handleCheckCheckatrade, showToast]);

  const handleScanEmails = useCallback(async () => {
    setEmailScanning(true);
    setEmailScanMsg(null);
    setEmailScanProgress(null);

    let totalFound  = 0;
    let totalDone   = 0;

    try {
      while (true) {
        const res  = await fetch("/api/possible-clients/scan-emails", { method: "POST" });
        const data = await res.json() as {
          found?: number; processed?: number; remaining?: number;
          message?: string; error?: string;
        };

        if (data.error) { showToast(data.error, "error"); break; }

        totalFound += data.found    ?? 0;
        totalDone  += data.processed ?? 0;
        const remaining = data.remaining ?? 0;

        setEmailScanProgress({ done: totalDone, total: totalDone + remaining });

        if (remaining === 0) {
          setEmailScanMsg(`Scan complete — checked ${totalDone} sites, found ${totalFound} email${totalFound !== 1 ? "s" : ""}.`);
          showToast(`Found ${totalFound} emails across ${totalDone} sites`, "success");
          await fetchBusinesses();
          break;
        }
      }
    } catch {
      showToast("Email scan failed — check your connection", "error");
    } finally {
      setEmailScanning(false);
      setEmailScanProgress(null);
    }
  }, [showToast, fetchBusinesses]);

  const handleCopyOutreach = useCallback(
    (business: Business, enrichment: CheckatradeEnrichment) => {
      const msg = buildOutreachMessage(business, enrichment);
      navigator.clipboard
        .writeText(msg)
        .then(() => showToast("Outreach message copied!", "success"))
        .catch(() => showToast("Could not copy to clipboard", "error"));
    },
    [showToast]
  );

  const handleEmailOutreach = useCallback(
    (business: Business) => {
      const email = buildWebsitePreviewEmail({
        businessName: business.name,
        contactEmail: business.email ?? undefined,
        previewUrl: undefined,
        location: business.city ?? undefined,
      });
      if (!email.recipient) {
        showToast("No email found — compose window will open with blank recipient", "success");
      }
      openEmailCompose(email);
    },
    [showToast]
  );

  // ── Derived data ─────────────────────────────────────────────────────────────

  let visibleBusinesses = businesses;
  if (sourceFilter)           visibleBusinesses = visibleBusinesses.filter((b) => getSource(b) === sourceFilter);
  if (hasCheckatradeFilter)   visibleBusinesses = visibleBusinesses.filter((b) => enrichments[b.id]?.has_checkatrade);
  if (hotLeadsOnly)           visibleBusinesses = visibleBusinesses.filter((b) => !b.website && enrichments[b.id]?.has_checkatrade);

  const totalPages    = Math.ceil(total / PAGE_SIZE);
  const checkatradeCount = Object.values(enrichments).filter((e) => e.has_checkatrade).length;
  const hotLeadCount  = visibleBusinesses.filter(
    (b) => !b.website && enrichments[b.id]?.has_checkatrade
  ).length;
  const uncheckedCount = businesses.filter(
    (b) => !enrichments[b.id] || !enrichments[b.id].has_checkatrade
  ).length;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-riden-border flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-white">Possible Clients</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Businesses scraped from Google Maps — find Checkatrade profiles without websites
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleScanEmails}
            disabled={emailScanning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-700/80 hover:bg-cyan-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Scan business websites to find missing email addresses"
          >
            {emailScanning ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
            {emailScanning && emailScanProgress
              ? `Scanning… ${emailScanProgress.done}/${emailScanProgress.total}`
              : emailScanning
              ? "Starting…"
              : "Scan for Emails"}
          </button>
          {uncheckedCount > 0 && (
            <button
              onClick={handleCheckAll}
              disabled={checkingAll || checkingIds.size > 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600/80 hover:bg-orange-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingAll ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <BadgeCheck size={15} />
              )}
              {checkingAll ? "Checking…" : `Check Checkatrade (${uncheckedCount})`}
            </button>
          )}
          <button
            onClick={() => setScrapeModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            <Plus size={15} />
            Run Scrape
          </button>
        </div>
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

        {/* Email scan result banner */}
        {emailScanMsg && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm">
            <div className="flex items-center gap-2">
              <Mail size={14} />
              {emailScanMsg}
            </div>
            <button onClick={() => setEmailScanMsg(null)} className="text-cyan-600 hover:text-cyan-400">
              <X size={13} />
            </button>
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

        {/* Hot leads callout */}
        {hotLeadCount > 0 && !hotLeadsOnly && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 cursor-pointer"
            onClick={() => setHotLeadsOnly(true)}
          >
            <Flame size={16} className="text-rose-400 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-rose-400 font-semibold text-sm">{hotLeadCount} Hot Lead{hotLeadCount !== 1 ? "s" : ""}</span>
              <span className="text-slate-400 text-sm"> — no website, on Checkatrade, ready to pitch</span>
            </div>
            <span className="text-xs text-rose-400 font-medium">View only →</span>
          </motion.div>
        )}

        {/* Stats row */}
        {!offline && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Total scraped",    value: total,                   color: "text-white" },
              { label: "Hot leads",        value: businesses.filter((b) => b.lead_score?.lead_tier === "hot").length, color: "text-rose-400" },
              { label: "Warm leads",       value: businesses.filter((b) => b.lead_score?.lead_tier === "warm").length, color: "text-amber-400" },
              { label: "No website",       value: businesses.filter((b) => !b.website).length, color: "text-violet-400" },
              { label: "On Checkatrade",   value: checkatradeCount,         color: "text-orange-400" },
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
              onChange={(e) => { setCity(e.target.value); setPage(1); setShowAll(false); }}
              className="w-full pl-8 pr-3 py-2 bg-riden-muted border border-riden-border rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="relative flex-1 min-w-[140px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by category..."
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); setShowAll(false); }}
              className="w-full pl-8 pr-3 py-2 bg-riden-muted border border-riden-border rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <select
            value={tier}
            onChange={(e) => { setTier(e.target.value); setPage(1); setShowAll(false); }}
            className="px-3 py-2 bg-riden-muted border border-riden-border rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="">All tiers</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cool">Cool</option>
            <option value="cold">Cold</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 bg-riden-muted border border-riden-border rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="">All sources</option>
            <option value="google_maps">Google Maps</option>
            <option value="checkatrade">Checkatrade</option>
          </select>

          {/* Toggle filters */}
          <button
            onClick={() => { setNoWebsiteOnly((v) => !v); setPage(1); }}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
              noWebsiteOnly
                ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                : "bg-riden-muted border-riden-border text-slate-400 hover:text-white"
            )}
          >
            No website
          </button>
          <button
            onClick={() => { setHasCheckatradeFilter((v) => !v); setHotLeadsOnly(false); }}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
              hasCheckatradeFilter
                ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                : "bg-riden-muted border-riden-border text-slate-400 hover:text-white"
            )}
          >
            <span className="flex items-center gap-1.5">
              <BadgeCheck size={13} />
              Has Checkatrade
            </span>
          </button>
          <button
            onClick={() => { setHotLeadsOnly((v) => !v); setHasCheckatradeFilter(false); }}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
              hotLeadsOnly
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                : "bg-riden-muted border-riden-border text-slate-400 hover:text-white"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Flame size={13} />
              Hot Leads
            </span>
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
          ) : visibleBusinesses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-riden-muted border border-riden-border flex items-center justify-center mb-3">
                <Flame size={20} className="text-slate-600" />
              </div>
              <p className="text-sm text-slate-400 font-medium">
                {hasCheckatradeFilter || hotLeadsOnly ? "No matches for this filter" : "No businesses yet"}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {offline
                  ? "Start the scraper to begin"
                  : hasCheckatradeFilter || hotLeadsOnly
                  ? "Run 'Check Checkatrade' to populate results"
                  : "Run a scrape to find potential clients"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-riden-border">
                    {["Business", "Source", "City", "Category", "Rating", "Phone", "Email", "Website", "Checkatrade", "Tier", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {visibleBusinesses.map((b, i) => {
                    const enrichment = enrichments[b.id];
                    const isImported = importedIds.has(b.id);
                    const isImporting = importingId === b.id;
                    const isChecking = checkingIds.has(b.id);
                    const opTier = enrichment
                      ? opportunityTier(enrichment.opportunity_score)
                      : null;
                    const isHotLead = !!enrichment?.has_checkatrade && !b.website;

                    return (
                      <motion.tr
                        key={b.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className={cn(
                          "border-b border-riden-border/50 hover:bg-riden-muted/30 transition-colors",
                          isHotLead && "bg-rose-500/5"
                        )}
                      >
                        {/* Business name + hot lead indicator */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isHotLead && <Flame size={12} className="text-rose-400 flex-shrink-0" />}
                            <span className="font-medium text-white max-w-[180px] truncate">{b.name}</span>
                          </div>
                          {enrichment && opTier && (
                            <div className={cn("text-xs mt-0.5 font-medium", opTier.text)}>
                              {isHotLead ? "🔥 " : ""}{opTier.label}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <SourceBadge business={b} />
                        </td>

                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {b.city ?? "—"}
                        </td>

                        <td className="px-4 py-3 text-slate-400 max-w-[120px] truncate">
                          {b.category ?? "—"}
                        </td>

                        <td className="px-4 py-3">
                          {b.rating != null ? (
                            <span className="flex items-center gap-1 text-amber-400 whitespace-nowrap">
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
                              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors whitespace-nowrap"
                            >
                              <Phone size={11} />
                              {b.phone}
                            </a>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {b.email ? (
                            <div className="flex items-center gap-1.5 max-w-[180px]">
                              <a
                                href={`mailto:${b.email}`}
                                className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition-colors truncate min-w-0"
                                title={b.email}
                              >
                                <Mail size={11} className="flex-shrink-0" />
                                <span className="truncate text-xs">{b.email}</span>
                              </a>
                              <button
                                onClick={() => navigator.clipboard.writeText(b.email!)}
                                className="flex-shrink-0 text-slate-600 hover:text-slate-300 transition-colors"
                                title="Copy email"
                              >
                                <ClipboardCopy size={10} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
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

                        {/* Checkatrade column */}
                        <td className="px-4 py-3 min-w-[140px]">
                          <CheckatradeCell
                            enrichment={enrichment}
                            isChecking={isChecking}
                            onCheck={() => handleCheckCheckatrade(b)}
                          />
                        </td>

                        <td className="px-4 py-3">
                          {b.lead_score ? (
                            <TierBadge tier={b.lead_score.lead_tier} score={b.lead_score.total_score} />
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {/* Google Maps link */}
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

                            {/* Checkatrade link (if confirmed) */}
                            {enrichment?.has_checkatrade && enrichment.checkatrade_url && (
                              <a
                                href={enrichment.checkatrade_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                                title="View Checkatrade profile"
                              >
                                <BadgeCheck size={13} />
                              </a>
                            )}

                            {/* Copy outreach (hot leads only) */}
                            {isHotLead && enrichment && (
                              <button
                                onClick={() => handleCopyOutreach(b, enrichment)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Copy outreach message"
                              >
                                <ClipboardCopy size={13} />
                              </button>
                            )}

                            {/* Email outreach */}
                            <button
                              onClick={() => handleEmailOutreach(b)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                              title="Write outreach email"
                            >
                              <Mail size={13} />
                            </button>

                            {/* Add to CRM */}
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

        {/* Opportunity legend */}
        {checkatradeCount > 0 && (
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Hot Lead = No website + Checkatrade
            </span>
            <span className="flex items-center gap-1.5">
              <Zap size={11} className="text-amber-500" />
              Score 50–69 = Warm
            </span>
            <span>
              <HelpCircle size={11} className="inline text-yellow-600 mr-1" />
              Possible = name didn&apos;t match closely — review manually
            </span>
          </div>
        )}

        {/* Pagination / Show All */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-slate-500">
              {showAll
                ? `Showing all ${total} businesses`
                : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`}
              {(hasCheckatradeFilter || hotLeadsOnly) && ` (filtered: ${visibleBusinesses.length})`}
            </p>

            <div className="flex gap-2 items-center">
              {/* Show All / Collapse */}
              {!showAll ? (
                <button
                  onClick={() => setShowAll(true)}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-violet-500/10 border border-violet-500/30 text-violet-400 hover:bg-violet-500/20 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                >
                  Show all {total}
                </button>
              ) : (
                <button
                  onClick={() => { setShowAll(false); setPage(1); }}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-riden-muted border border-riden-border text-slate-400 hover:text-white transition-colors disabled:opacity-40"
                >
                  Back to pages
                </button>
              )}

              {/* Previous / Next (only when paginating) */}
              {!showAll && (
                <>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="px-3 py-1.5 rounded-lg text-xs bg-riden-muted border border-riden-border text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                    className="px-3 py-1.5 rounded-lg text-xs bg-riden-muted border border-riden-border text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
                  >
                    Next
                  </button>
                </>
              )}
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
