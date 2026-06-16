"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, MoreHorizontal, RefreshCw, FolderOpen, X,
  AlertTriangle, CheckCircle, Trash2, Eye, Users,
  Calendar, PoundSterling, TrendingUp,
  Star, Globe, MapPin, Search, Sparkles, Copy, Phone, Mail, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { PRICING_TIERS, getTier, type PricingTier } from "@/lib/pricing";
import { runWebsiteBriefQaAgent, type WebsiteBriefQaPhotosJson, type WebsiteBriefQaResult } from "@/lib/website-brief-qa-agent";

type Project = {
  id: string;
  name: string;
  clientName: string;
  status: string;
  budget: number;
  spent: number;
  progress: number;
  dueDate: string | null;
  notes: string | null;
  completedAt?: string | null;
  createdAt: string;
  // Brief fields
  phone?: string;
  email?: string;
  city?: string;
  postcode?: string;
  industry?: string;
  services?: string;
  about?: string;
  accreditations?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  openingHours?: string;
  reviewsJson?: string;
  photosJson?: string;
  pricingTier?: string;
  setupFee?: number;
  monthlyFee?: number;
};

type Review = {
  author: string;
  rating: number;
  body: string;
  source: "google" | "checkatrade" | "manual";
  date?: string;
};

type Toast = { msg: string; type: "success" | "error" };

type HeroHotspot = {
  label: string; href: string;
  x: number; y: number; width: number; height: number;
  variant?: 'primary' | 'secondary';
  hideMobile?: boolean;
};

type BrandColours = {
  primary:   string;
  secondary: string;
  tertiary:  string;
};

type TrustCardLocation = 'hero' | 'about';

type TrustCard = {
  id:       string;
  title:    string;
  value:    string;
  icon:     string;
  location: TrustCardLocation[];
  enabled:  boolean;
};

type AboutProofCard = {
  id:       string;
  title:    string;
  value:    string;
  subtitle: string;
  icon:     string;
  enabled:  boolean;
};

type ReviewSettings = {
  platform:        string;
  reviewCount:     number | undefined;
  averageRating:   string;
  platformUrl:     string;
  showReviewBadge: boolean;
  showRatingBadge: boolean;
};

const DEFAULT_REVIEW_SETTINGS: ReviewSettings = {
  platform:        "Checkatrade",
  reviewCount:     undefined,
  averageRating:   "",
  platformUrl:     "",
  showReviewBadge: true,
  showRatingBadge: true,
};

type PhotoInAlbum = {
  id:           string;
  url:          string;
  alt?:         string;
  caption?:     string;
  displayOrder: number;
};

type ProjectAlbum = {
  id:             string;
  title:          string;
  description?:   string;
  category?:      string;
  sourceUrl?:     string;
  coverImageUrl?: string;
  photos:         PhotoInAlbum[];
  enabled:        boolean;
  displayOrder:   number;
};

type BriefBeforeAfterPair = {
  id:           string;
  beforeUrl:    string;
  afterUrl:     string;
  title?:       string;
  caption?:     string;
  category?:    string;
  displayOrder: number;
  enabled:      boolean;
};

// ── Checkatrade import parser ─────────────────────────────────────────────────

type ParsedCheckatradeImport = {
  phone: string;
  email: string;
  city: string;
  postcode: string;
  services: string;
  about: string;
  accreditations: string;
  openingHours: string;
  socialFacebook: string;
  socialInstagram: string;
  newReviews: Review[];
  newPhotos: string[];
  newReviewSettings: ReviewSettings;
  serviceAreas: string[];
};

const CT_NAV_WORDS = new Set([
  "overview","skills","reviews","photos","company info","company information",
  "view services","website","request a quote","get a free quote","contact",
  "share","save","report","flag","print","menu","back","get quotes",
]);

const CT_NOISE_RE = /\b(overview|skills|reviews|photos|company\s+info(?:rmation)?|request\s+a\s+quote|view\s+services|get\s+quotes)\b/gi;

function parseCheckatradeImport(
  data: Record<string, unknown>,
  profileUrl: string
): ParsedCheckatradeImport {
  const skillsList = Array.isArray(data.skills)         ? (data.skills         as string[]) : [];
  const areasList  = Array.isArray(data.areas)          ? (data.areas          as string[]) : [];
  const acredList  = Array.isArray(data.accreditations) ? (data.accreditations as string[]) : [];
  const capsList   = Array.isArray(data.capabilities)   ? (data.capabilities   as string[]) : [];

  // Services: one per line, deduplicated, nav words removed
  const seenSvc = new Set<string>();
  const cleanServices: string[] = [];
  for (const s of skillsList) {
    const t = s.trim();
    const lower = t.toLowerCase();
    if (t && !CT_NAV_WORDS.has(lower) && !seenSvc.has(lower)) {
      seenSvc.add(lower);
      cleanServices.push(t);
    }
  }
  const services = cleanServices.join("\n");

  // About: description only — no metadata dump
  let about = ((data.description as string) ?? "").trim();
  about = about.replace(CT_NOISE_RE, "").replace(/\s{2,}/g, " ").trim();

  // Build a comprehensive fallback when no description was scraped
  if (about.length < 80) {
    const parts: string[] = [];
    const bName = (data.name as string) ?? "";
    const bCity = (data.city as string) ?? "";
    const owner = (data.owner as string) ?? "";
    const companyType = (data.companyType as string) ?? "";
    const vatRegistered = (data.vatRegistered as string) ?? "";
    const yearsOnCT = (data.yearsOnCheckatrade as string) ?? "";
    const tradingYrs = (data.tradingYears as string) ?? "";
    const rc = data.reviewCount ? Number(data.reviewCount) : 0;
    const rg = data.rating ? String(data.rating) : "";

    // Opening sentence with name, location, top services
    if (bName) {
      const top = cleanServices.slice(0, 3).join(", ").toLowerCase();
      const loc = bCity ? ` based in ${bCity}` : "";
      const svc = top ? `, specialising in ${top}` : "";
      parts.push(`${bName} is${loc}${svc}.`);
    }

    // Company details
    if (owner) parts.push(`Operated by ${owner}.`);
    if (companyType) parts.push(`Registered as ${companyType}.`);
    if (vatRegistered) parts.push(vatRegistered + ".");

    // Experience signals
    if (tradingYrs) parts.push(`Trading for ${tradingYrs} years.`);
    if (yearsOnCT) parts.push(`${yearsOnCT} years on Checkatrade.`);

    // Service areas
    if (areasList.length > 0) {
      parts.push(`Covering ${areasList.slice(0, 6).join(", ")} and surrounding areas.`);
    }

    // Capabilities
    if (capsList.length > 0) {
      parts.push(capsList.join(". ") + ".");
    }

    // Trust / reviews
    if (rc > 0) {
      parts.push(`With ${rc} verified reviews${rg ? ` rated ${rg}/10` : ""} on Checkatrade.`);
    }

    if (parts.length > 0) about = parts.join(" ");
  }

  // Accreditations: array only (not vatRegistered — that's company metadata)
  const accreditations = acredList.join(", ");

  // Reviews
  const newReviews: Review[] = Array.isArray(data.reviews)
    ? (data.reviews as Record<string, unknown>[]).map((r) => ({
        author: String(r.author ?? "Verified Customer"),
        rating: Number(r.rating ?? 5),
        body:   String(r.body   ?? ""),
        source: "checkatrade" as const,
        date:   String(r.date   ?? ""),
      }))
    : [];

  // Photos
  const newPhotos: string[] = Array.isArray(data.photos) ? (data.photos as string[]) : [];

  // Review settings
  const newReviewSettings: ReviewSettings = {
    platform:        "Checkatrade",
    reviewCount:     data.reviewCount ? Number(data.reviewCount) : undefined,
    averageRating:   data.rating ? String(data.rating) : "",
    platformUrl:     profileUrl || "",
    showReviewBadge: true,
    showRatingBadge: true,
  };

  return {
    phone:           (data.phone           as string) ?? "",
    email:           (data.email           as string) ?? "",
    city:            (data.city            as string) ?? "",
    postcode:        (data.postcode        as string) ?? "",
    services,
    about,
    accreditations,
    openingHours:    (data.openingHours    as string) ?? "",
    socialFacebook:  (data.socialFacebook  as string) ?? "",
    socialInstagram: (data.socialInstagram as string) ?? "",
    newReviews,
    newPhotos,
    newReviewSettings,
    serviceAreas: areasList,
  };
}

function formatReviewCount(n: number): string {
  if (n < 10) return String(n);
  return `${Math.floor(n / 10) * 10}+`;
}

const TRUST_CARD_ICONS = ['star', 'shield', 'check', 'clock', 'calendar', 'award', 'map-pin'] as const;

const DEFAULT_ABOUT_PROOF_CARDS: AboutProofCard[] = [
  { id: 'experience',    title: 'Experience',    value: '',     subtitle: 'Years in the trade',           icon: 'calendar', enabled: true  },
  { id: 'craftsmanship', title: 'Craftsmanship', value: '',     subtitle: 'Precision in every detail',    icon: 'star',     enabled: true  },
  { id: 'communication', title: 'Communication', value: '',     subtitle: 'Dedicated point of contact',   icon: 'check',    enabled: true  },
  { id: 'insured',       title: 'Fully Insured', value: 'Yes',  subtitle: 'Public liability covered',     icon: 'shield',   enabled: false },
  { id: 'avail',         title: 'Availability',  value: '24/7', subtitle: 'Emergency enquiries',          icon: 'clock',    enabled: false },
];

const DEFAULT_TRUST_CARDS: TrustCard[] = [
  { id: 'fully-insured', title: 'Fully Insured',  value: '',     icon: 'shield', location: ['hero'], enabled: false },
  { id: 'free-quotes',   title: 'Free Quotes',    value: '',     icon: 'check',  location: ['hero'], enabled: false },
  { id: 'avg-rating',    title: 'Average Rating', value: '',     icon: 'star',   location: ['hero'], enabled: false },
  { id: 'reviews',       title: 'Reviews',        value: '',     icon: 'award',  location: ['hero'], enabled: false },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  planning:    { label: "Planning",     color: "text-blue-400",    bg: "bg-blue-400" },
  in_progress: { label: "In Progress",  color: "text-amber-400",   bg: "bg-amber-400" },
  review:      { label: "In Review",    color: "text-violet-400",  bg: "bg-violet-400" },
  completed:   { label: "Completed",    color: "text-emerald-400", bg: "bg-emerald-400" },
  paused:      { label: "Paused",       color: "text-slate-400",   bg: "bg-slate-400" },
};

const STATUS_OPTIONS = ["planning", "in_progress", "review", "completed", "paused"];

const INDUSTRY_OPTIONS = [
  { value: "trades",        label: "Trades" },
  { value: "professional",  label: "Professional" },
  { value: "hospitality",   label: "Hospitality" },
  { value: "beauty",        label: "Beauty" },
  { value: "health",        label: "Health" },
  { value: "retail",        label: "Retail" },
];

const inputCls =
  "w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors";

// ─── Template brief configs ───────────────────────────────────────────────────
// Controls which brief sections are shown per template.

type TemplateBriefConfig = {
  label:               string;
  description:         string;
  tier:                string;
  servicesLabel:       string;
  servicesPlaceholder: string;
  showAboutProofCards: boolean;
  showTrustCards:      boolean;
  showAccreditations:  boolean;
  showCheckatrade:     boolean;
  showBeforeAfter:     boolean;
};

const TEMPLATE_BRIEF_CONFIGS: Record<string, TemplateBriefConfig> = {
  'modern-minimal': {
    label:               'Modern Minimal',
    description:         'Clean light layout — trades, general business',
    tier:                'Pro+',
    servicesLabel:       'Services',
    servicesPlaceholder: 'e.g. Boiler installation, central heating, emergency call-outs...',
    showAboutProofCards: true,
    showTrustCards:      true,
    showAccreditations:  true,
    showCheckatrade:     true,
    showBeforeAfter:     false,
  },
  'tradie-bold': {
    label:               'Tradie Bold',
    description:         'High-contrast dark design — electricians, plumbers, builders',
    tier:                'Pro',
    servicesLabel:       'Services',
    servicesPlaceholder: 'e.g. Emergency callouts, full rewires, EV charger installation...',
    showAboutProofCards: false,
    showTrustCards:      true,
    showAccreditations:  true,
    showCheckatrade:     true,
    showBeforeAfter:     false,
  },
  'outdoor-transform': {
    label:               'Outdoor Transformations',
    description:         'Before/after led — landscapers, driveways, fencing, tree surgery',
    tier:                'Pro',
    servicesLabel:       'Services',
    servicesPlaceholder: 'e.g. Garden landscaping, driveway installation, fencing, turfing, tree surgery...',
    showAboutProofCards: false,
    showTrustCards:      true,
    showAccreditations:  true,
    showCheckatrade:     true,
    showBeforeAfter:     true,
  },
  'emergency-trade': {
    label:               'Emergency & Response',
    description:         'Call-now led — emergency plumbers, electricians, locksmiths, drainage',
    tier:                'Pro',
    servicesLabel:       'Services',
    servicesPlaceholder: 'e.g. Emergency call-outs, boiler repairs, blocked drains, fault finding...',
    showAboutProofCards: false,
    showTrustCards:      true,
    showAccreditations:  true,
    showCheckatrade:     true,
    showBeforeAfter:     false,
  },
  'reno-showcase': {
    label:               'Renovation Showcase',
    description:         'Showroom feel — kitchens, bathrooms, lofts, extensions, builders',
    tier:                'Pro',
    servicesLabel:       'Services',
    servicesPlaceholder: 'e.g. Kitchen fitting, bathroom renovation, loft conversions, extensions...',
    showAboutProofCards: false,
    showTrustCards:      true,
    showAccreditations:  true,
    showCheckatrade:     true,
    showBeforeAfter:     true,
  },
  'finish-decor': {
    label:               'Finish & Decorating',
    description:         'Finish-quality led — painters, plasterers, tilers, flooring',
    tier:                'Pro',
    servicesLabel:       'Services',
    servicesPlaceholder: 'e.g. Interior painting, exterior decorating, plastering, tiling, flooring...',
    showAboutProofCards: false,
    showTrustCards:      true,
    showAccreditations:  true,
    showCheckatrade:     true,
    showBeforeAfter:     true,
  },
  'beauty-pro-booking': {
    label:               'Beauty Pro+ Booking',
    description:         'Elegant booking template — salons, therapists, spas',
    tier:                'Pro+',
    servicesLabel:       'Treatments & Services',
    servicesPlaceholder: 'e.g. Facials, massage, eyelash extensions, waxing, microblading...',
    showAboutProofCards: false,
    showTrustCards:      false,
    showAccreditations:  false,
    showCheckatrade:     false,
    showBeforeAfter:     false,
  },
};

// Demo sites in the template engine used for live template previews
const TEMPLATE_PREVIEW_DEMOS: Record<string, string> = {
  'modern-minimal':     'plumber',
  'tradie-bold':        'electrician',
  'beauty-pro-booking': 'beauty',
  'outdoor-transform':  'demo-outdoor',
  'emergency-trade':    'demo-emergency',
  'reno-showcase':      'demo-reno',
  'finish-decor':       'demo-finish',
};

function templatePreviewUrl(templateId: string): string | null {
  const demo = TEMPLATE_PREVIEW_DEMOS[templateId];
  if (!demo) return null;
  const base = typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "https://sites.ridentechnologies.com";
  return `${base}/preview/${demo}`;
}

function inferMonthlyRate(notes: string | null): number {
  const text = (notes ?? "").toLowerCase();
  if (text.includes("enterprise") || text.includes("1,000") || text.includes("1000")) return 100;
  if (text.includes("pro+") || text.includes("pro ") || text.includes("500")) return 50;
  return 25;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={11}
          className={i <= rating ? "text-amber-400 fill-amber-400" : "text-slate-600"}
        />
      ))}
    </div>
  );
}

// ─── Hotspot Editor ──────────────────────────────────────────────────────────
// Visual drag-to-draw editor for .webp artwork hero click zones.

const HOTSPOT_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

function HotspotsEditor({
  imageUrl, hotspots, onChange,
}: {
  imageUrl:  string;
  hotspots:  HeroHotspot[];
  onChange:  (next: HeroHotspot[]) => void;
}) {
  const containerRef              = useRef<HTMLDivElement>(null);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawing,   setDrawing]   = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  function pct(e: React.MouseEvent) {
    const r = containerRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width)  * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top)  / r.height) * 100)),
    };
  }

  function onDown(e: React.MouseEvent) {
    const p = pct(e); setDrawStart(p); setDrawing({ x: p.x, y: p.y, w: 0, h: 0 });
  }
  function onMove(e: React.MouseEvent) {
    if (!drawStart) return;
    const p = pct(e);
    setDrawing({ x: Math.min(drawStart.x, p.x), y: Math.min(drawStart.y, p.y),
                 w: Math.abs(p.x - drawStart.x), h: Math.abs(p.y - drawStart.y) });
  }
  function onUp() {
    if (drawing && drawing.w >= 2 && drawing.h >= 2) {
      onChange([...hotspots, {
        label: `Button ${hotspots.length + 1}`, href: "#contact",
        x: Math.round(drawing.x), y: Math.round(drawing.y),
        width: Math.round(drawing.w), height: Math.round(drawing.h),
      }]);
    }
    setDrawStart(null); setDrawing(null);
  }

  function upd(i: number, patch: Partial<HeroHotspot>) {
    const next = [...hotspots]; next[i] = { ...next[i], ...patch }; onChange(next);
  }

  const numCls = "w-full bg-black/30 border border-riden-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50";
  const txtCls = "bg-black/30 border border-riden-border rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50";

  return (
    <div className="space-y-3">
      {/* Image canvas — drag to draw hotspot zones */}
      <div
        ref={containerRef}
        className="relative w-full select-none cursor-crosshair rounded-xl overflow-hidden border border-blue-500/30"
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Hero artwork" className="w-full h-auto block" draggable={false} />

        {/* Saved hotspot overlays */}
        {hotspots.map((hs, i) => (
          <div key={i} style={{
            position: "absolute", left: `${hs.x}%`, top: `${hs.y}%`,
            width: `${hs.width}%`, height: `${hs.height}%`,
            border: `2px solid ${HOTSPOT_COLORS[i % HOTSPOT_COLORS.length]}`,
            backgroundColor: `${HOTSPOT_COLORS[i % HOTSPOT_COLORS.length]}28`,
            borderRadius: 4, pointerEvents: "none",
          }}>
            <span style={{
              position: "absolute", top: "-1.1rem", left: 0,
              background: HOTSPOT_COLORS[i % HOTSPOT_COLORS.length],
              color: "#fff", fontSize: 9, fontWeight: 700,
              padding: "1px 5px", borderRadius: 3, whiteSpace: "nowrap", lineHeight: 1.4,
            }}>{i + 1}: {hs.label}</span>
          </div>
        ))}

        {/* Live drag preview */}
        {drawing && drawing.w > 1 && (
          <div style={{
            position: "absolute", left: `${drawing.x}%`, top: `${drawing.y}%`,
            width: `${drawing.w}%`, height: `${drawing.h}%`,
            border: "2px dashed #60a5fa", backgroundColor: "rgba(96,165,250,0.15)",
            pointerEvents: "none",
          }} />
        )}
      </div>

      <p className="text-[10px] text-slate-500">
        Click and drag on the image to draw a zone over each CTA button. Edit labels and links below.
      </p>

      {/* Per-hotspot forms */}
      {hotspots.map((hs, i) => (
        <div key={i} className="rounded-xl border bg-riden-muted p-3 space-y-2"
          style={{ borderColor: `${HOTSPOT_COLORS[i % HOTSPOT_COLORS.length]}55` }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold" style={{ color: HOTSPOT_COLORS[i % HOTSPOT_COLORS.length] }}>
              Hotspot {i + 1}
            </span>
            <button onClick={() => onChange(hotspots.filter((_, j) => j !== i))}
              className="text-slate-500 hover:text-rose-400 transition-colors">
              <X size={12} />
            </button>
          </div>
          {/* Variant toggle */}
          <div className="flex gap-1.5">
            {(["primary", "secondary"] as const).map((v) => (
              <button key={v} onClick={() => upd(i, { variant: v })}
                className={`px-3 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${hs.variant === v || (!hs.variant && v === "primary") ? "border-[#d6ad74] text-[#d6ad74] bg-[#d6ad74]/10" : "border-riden-border text-slate-500 hover:text-slate-300"}`}>
                {v === "primary" ? "Primary (gold)" : "Secondary (glass)"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={hs.label} onChange={(e) => upd(i, { label: e.target.value })}
              placeholder="Button label" className={txtCls} />
            <input value={hs.href} onChange={(e) => upd(i, { href: e.target.value })}
              placeholder="/contact or tel:…" className={txtCls} />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(["x", "y", "width", "height"] as const).map((f) => (
              <div key={f}>
                <p className="text-[9px] text-slate-500 mb-0.5 uppercase tracking-wider">
                  {f === "width" ? "W%" : f === "height" ? "H%" : `${f.toUpperCase()}%`}
                </p>
                <input type="number" min={0} max={100} step={0.5}
                  value={hs[f]}
                  onChange={(e) => upd(i, { [f]: parseFloat(e.target.value) || 0 })}
                  className={numCls} />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={hs.hideMobile ?? false}
              onChange={(e) => upd(i, { hideMobile: e.target.checked })}
              className="w-3 h-3 accent-blue-500" />
            <span className="text-[10px] text-slate-400">Hide on mobile (&lt; 768 px)</span>
          </label>
        </div>
      ))}

      {hotspots.length === 0 && (
        <p className="text-[10px] text-slate-600 italic">No hotspots yet — draw on the image above to add clickable zones.</p>
      )}
    </div>
  );
}

// ─── Project Detail Modal ─────────────────────────────────────────────────────

function ProjectDetailModal({
  project: initialProject,
  onClose,
  onUpdate,
  onDelete,
}: {
  project: Project;
  onClose: () => void;
  onUpdate: (updated: Project) => void;
  onDelete: (project: Project) => void;
}) {
  const [project, setProject] = useState(initialProject);
  const [activeTab, setActiveTab] = useState<"overview" | "brief">("overview");

  // Overview state
  const [editing, setEditing] = useState({
    spent:    String(initialProject.spent),
    progress: String(initialProject.progress),
    notes:    initialProject.notes ?? "",
  });
  const [saving, setSaving]               = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [completing, setCompleting]       = useState(false);
  const [completed, setCompleted]         = useState(false);
  const [error, setError]                 = useState("");

  // Brief state
  const [brief, setBrief] = useState({
    phone:           initialProject.phone           ?? "",
    email:           initialProject.email           ?? "",
    city:            initialProject.city            ?? "",
    postcode:        initialProject.postcode        ?? "",
    industry:        initialProject.industry        ?? "trades",
    services:        initialProject.services        ?? "",
    about:           initialProject.about           ?? "",
    accreditations:  initialProject.accreditations  ?? "",
    socialFacebook:  initialProject.socialFacebook  ?? "",
    socialInstagram: initialProject.socialInstagram ?? "",
    openingHours:    initialProject.openingHours    ?? "",
    pricingTier:     (initialProject.pricingTier ?? "pro") as PricingTier,
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    try { return JSON.parse(initialProject.reviewsJson ?? "[]"); } catch { return []; }
  });

  // photosJson stores { logo, heroImages, hero(legacy), gallery, heroHotspots, colours } or legacy plain string[]
  const parsedPhotos = (() => {
    const emptyColours: BrandColours = { primary: "", secondary: "", tertiary: "" };
    const empty: ProjectAlbum[] = [];
    function legacyAlbum(urls: string[]): ProjectAlbum[] {
      if (urls.length === 0) return [];
      return [{ id: "default_album", title: "Our Work", description: "", category: "", sourceUrl: "", coverImageUrl: urls[0], photos: urls.map((url, i) => ({ id: `ph_${i}`, url, alt: "", caption: "", displayOrder: i })), enabled: true, displayOrder: 0 }];
    }
    try {
      const raw = JSON.parse(initialProject.photosJson ?? "{}");
      if (Array.isArray(raw)) return { logo: "", heroImages: [] as string[], heroMobile: "", gallery: raw as string[], heroHotspots: [] as HeroHotspot[], colours: emptyColours, trustCards: DEFAULT_TRUST_CARDS, aboutProofCards: DEFAULT_ABOUT_PROOF_CARDS, reviewSettings: DEFAULT_REVIEW_SETTINGS, projectAlbums: legacyAlbum(raw as string[]), beforeAfterPairs: [] as BriefBeforeAfterPair[], qa: {} as WebsiteBriefQaPhotosJson };
      const rc = raw.colours && typeof raw.colours === "object" ? raw.colours as Record<string, unknown> : {};
      const heroImages: string[] = Array.isArray(raw.heroImages) ? raw.heroImages as string[] : raw.hero ? [String(raw.hero)] : [];
      const gallery: string[] = Array.isArray(raw.gallery) ? raw.gallery as string[] : [];
      const rawAlbums: ProjectAlbum[] = Array.isArray(raw.projectAlbums) ? raw.projectAlbums as ProjectAlbum[] : [];
      const projectAlbums = rawAlbums.length > 0 ? rawAlbums : legacyAlbum(gallery);
      return {
        logo:         String(raw.logo       ?? ""),
        heroImages,
        heroMobile:   String(raw.heroMobile ?? ""),
        gallery,
        heroHotspots: Array.isArray(raw.heroHotspots)  ? raw.heroHotspots  as HeroHotspot[] : [],
        colours: { primary: String(rc.primary ?? ""), secondary: String(rc.secondary ?? ""), tertiary: String(rc.tertiary ?? "") } as BrandColours,
        trustCards:      Array.isArray(raw.trustCards)      ? raw.trustCards      as TrustCard[]      : DEFAULT_TRUST_CARDS,
        aboutProofCards: Array.isArray(raw.aboutProofCards) ? raw.aboutProofCards as AboutProofCard[] : DEFAULT_ABOUT_PROOF_CARDS,
        reviewSettings:  raw.reviewSettings && typeof raw.reviewSettings === "object" ? raw.reviewSettings as ReviewSettings : DEFAULT_REVIEW_SETTINGS,
        aboutImage:  String(raw.aboutImage ?? ""),
        projectAlbums,
        beforeAfterPairs: Array.isArray(raw.beforeAfterPairs) ? raw.beforeAfterPairs as BriefBeforeAfterPair[] : [],
        qa: {
          qaStatus: raw.qaStatus,
          qaScore: raw.qaScore,
          qaLastRunAt: raw.qaLastRunAt,
          qaWarnings: Array.isArray(raw.qaWarnings) ? raw.qaWarnings : [],
          qaSuggestions: Array.isArray(raw.qaSuggestions) ? raw.qaSuggestions : [],
          qaChanges: Array.isArray(raw.qaChanges) ? raw.qaChanges : [],
          generatedLogo: raw.generatedLogo,
          logoSource: raw.logoSource,
          suggestedBrandColours: raw.suggestedBrandColours,
          photoCategories: Array.isArray(raw.photoCategories) ? raw.photoCategories : [],
          primaryHeroImage: raw.primaryHeroImage,
        } as WebsiteBriefQaPhotosJson,
      };
    } catch { return { logo: "", heroImages: [] as string[], heroMobile: "", gallery: [], heroHotspots: [] as HeroHotspot[], colours: emptyColours, trustCards: DEFAULT_TRUST_CARDS, aboutProofCards: DEFAULT_ABOUT_PROOF_CARDS, reviewSettings: DEFAULT_REVIEW_SETTINGS, projectAlbums: empty, beforeAfterPairs: [] as BriefBeforeAfterPair[], qa: {} as WebsiteBriefQaPhotosJson }; }
  })();

  const [logoUrl, setLogoUrl]                   = useState<string>(parsedPhotos.logo);
  const [heroImages, setHeroImages]             = useState<string[]>(parsedPhotos.heroImages);
  const [heroMobilePhoto, setHeroMobilePhoto]   = useState<string>(parsedPhotos.heroMobile);
  const [aboutImage,      setAboutImage]        = useState<string>(parsedPhotos.aboutImage ?? "");
  const [photos, setPhotos]                     = useState<string[]>(parsedPhotos.gallery);
  const logoFileRef                             = useRef<HTMLInputElement>(null);
  const heroFileRef                             = useRef<HTMLInputElement>(null);
  const heroMobileFileRef                       = useRef<HTMLInputElement>(null);
  const galleryFileRef                          = useRef<HTMLInputElement>(null);
  const [heroHotspots, setHeroHotspots]         = useState<HeroHotspot[]>(parsedPhotos.heroHotspots);
  const [brandColours, setBrandColours]         = useState<BrandColours>(parsedPhotos.colours);
  const [trustCards,       setTrustCards]       = useState<TrustCard[]>(parsedPhotos.trustCards ?? DEFAULT_TRUST_CARDS);
  const [aboutProofCards, setAboutProofCards]   = useState<AboutProofCard[]>(parsedPhotos.aboutProofCards ?? DEFAULT_ABOUT_PROOF_CARDS);
  const [reviewSettings,  setReviewSettings]    = useState<ReviewSettings>(parsedPhotos.reviewSettings ?? DEFAULT_REVIEW_SETTINGS);
  const [projectAlbums,   setProjectAlbums]     = useState<ProjectAlbum[]>(parsedPhotos.projectAlbums ?? []);
  const [beforeAfterPairs, setBeforeAfterPairs] = useState<BriefBeforeAfterPair[]>(parsedPhotos.beforeAfterPairs ?? []);
  const [qaMeta, setQaMeta]                     = useState<WebsiteBriefQaPhotosJson>(parsedPhotos.qa ?? {});
  const [qaReview, setQaReview]                 = useState<WebsiteBriefQaResult | null>(null);
  const [qaRunning, setQaRunning]               = useState(false);
  const [showQaModal, setShowQaModal]           = useState(false);
  const [qaAfterGoogleImportPending, setQaAfterGoogleImportPending] = useState(false);
  const [expandedAlbumId, setExpandedAlbumId]   = useState<string | null>(null);
  const [albumUrlInputs,  setAlbumUrlInputs]    = useState<Record<string, string>>({});
  const [albumImportingMap, setAlbumImportingMap] = useState<Record<string, boolean>>({});
  const [albumMsgs,       setAlbumMsgs]         = useState<Record<string, string>>({});
  const [albumPhotoInputs, setAlbumPhotoInputs] = useState<Record<string, string>>({});
  const [heroUploading, setHeroUploading]       = useState(false);
  const [heroMobileUploading, setHeroMobileUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [heroUploadError, setHeroUploadError]   = useState("");
  const [heroMobileUploadError, setHeroMobileUploadError] = useState("");
  const [galleryUploadError, setGalleryUploadError] = useState("");
  const [heroUrlInput, setHeroUrlInput]         = useState("");

  // Brief form (send-to-client)
  const [briefFormToken,    setBriefFormToken]    = useState<string | null>(null);
  const [briefFormStatus,   setBriefFormStatus]   = useState<string | null>(null);
  const [briefFormCreating, setBriefFormCreating] = useState(false);
  const [briefFormCopied,   setBriefFormCopied]   = useState(false);

  useEffect(() => {
    fetch(`/api/brief-forms?projectId=${initialProject.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.form) { setBriefFormToken(d.form.token); setBriefFormStatus(d.form.status); } })
      .catch(() => null);
  }, [initialProject.id]);

  async function createBriefForm() {
    setBriefFormCreating(true);
    try {
      const res = await fetch("/api/brief-forms", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ projectId: initialProject.id }),
      });
      const data = await res.json();
      setBriefFormToken(data.token);
      setBriefFormStatus("pending");
    } finally {
      setBriefFormCreating(false);
    }
  }

  function copyBriefFormLink() {
    if (!briefFormToken) return;
    navigator.clipboard.writeText(`${window.location.origin}/brief/${briefFormToken}`);
    setBriefFormCopied(true);
    setTimeout(() => setBriefFormCopied(false), 2500);
  }

  function reloadBriefAfterSubmit() {
    // Re-fetch the project to pull in any submitted brief values
    fetch(`/api/projects/${initialProject.id}`)
      .then((r) => r.json())
      .then((d) => {
        const p = d.project ?? d;
        setBrief({
          phone:           p.phone           ?? "",
          email:           p.email           ?? "",
          city:            p.city            ?? "",
          postcode:        p.postcode        ?? "",
          industry:        p.industry        ?? "trades",
          services:        p.services        ?? "",
          about:           p.about           ?? "",
          accreditations:  p.accreditations  ?? "",
          socialFacebook:  p.socialFacebook  ?? "",
          socialInstagram: p.socialInstagram ?? "",
          openingHours:    p.openingHours    ?? "",
          pricingTier:     (p.pricingTier ?? "pro") as PricingTier,
        });
        setBriefFormStatus("submitted");
      })
      .catch(() => null);
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX_H = 400;
        if (img.height <= MAX_H) { setLogoUrl(dataUrl); return; }
        const scale  = MAX_H / img.height;
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width * scale);
        canvas.height = MAX_H;
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setLogoUrl(canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.85));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    // reset so same file can be re-selected
    e.target.value = "";
  }
  async function handleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setHeroUploading(true);
    setHeroUploadError("");
    try {
      const urls = await Promise.all(files.map(async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        const res  = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json() as { ok?: boolean; url?: string; error?: string };
        if (!res.ok || !data.ok) throw new Error(data.error ?? "Upload failed");
        return data.url!;
      }));
      setHeroImages((prev) => {
        const next = [...prev, ...urls];
        // For .webp artwork (single primary), suggest default hotspot zones
        const primary = next[0];
        if (primary?.split("?")[0].toLowerCase().endsWith(".webp") && heroHotspots.length === 0) {
          setHeroHotspots([
            { label: "Get a Free Quote", href: brief.phone ? `tel:${brief.phone}` : "#contact", variant: "primary"   as const, x: 4,  y: 67, width: 19, height: 9 },
            { label: "Our Services",     href: "#services",                                       variant: "secondary" as const, x: 25, y: 67, width: 17, height: 9, hideMobile: true },
          ]);
        }
        return next;
      });
    } catch (err) {
      setHeroUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setHeroUploading(false);
    }
  }

  function addHeroByUrl() {
    const url = heroUrlInput.trim();
    if (!url) return;
    setHeroImages((prev) => (prev.includes(url) ? prev : [...prev, url]));
    setHeroUrlInput("");
  }

  async function handleHeroMobileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setHeroMobileUploading(true);
    setHeroMobileUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json() as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Upload failed");
      setHeroMobilePhoto(data.url!);
    } catch (err) {
      setHeroMobileUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setHeroMobileUploading(false);
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setGalleryUploading(true);
    setGalleryUploadError("");
    try {
      const urls = await Promise.all(files.map(async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json() as { ok?: boolean; url?: string; error?: string };
        if (!res.ok || !data.ok) throw new Error(data.error ?? "Upload failed");
        return data.url!;
      }));
      setPhotos((prev) => [...prev, ...urls]);
    } catch (err) {
      setGalleryUploadError(err instanceof Error ? err.message : "One or more uploads failed");
    } finally {
      setGalleryUploading(false);
    }
  }

  const [selectedTemplate, setSelectedTemplate] = useState<string>(() => {
    const p = initialProject as Record<string, unknown>;
    const candidate = (p.templateId as string) || (p.recommendedTemplate as string) || "modern-minimal";
    return candidate in TEMPLATE_BRIEF_CONFIGS ? candidate : "modern-minimal";
  });
  const templateBriefConfig = TEMPLATE_BRIEF_CONFIGS[selectedTemplate] ?? TEMPLATE_BRIEF_CONFIGS['modern-minimal'];

  // Checkatrade scraper state
  const [checkatrade, setCheckatrade] = useState<{
    url:          string;
    loading:      boolean;
    imported:     boolean;
    error:        string;
    rating?:      string;
    reviewCount?: number;
    noProfile?:   boolean;
    serviceAreas?: string[];
  }>({
    url:      "",
    loading:  false,
    imported: false,
    error:    "",
  });

  // Browser-based photo scrape (ScrapingBee — synchronous, runs after fast scrape)
  const [ctBrowser, setCtBrowser] = useState<{
    loading: boolean;
    error:   string;
  }>({ loading: false, error: "" });

  // ── Album helper functions ────────────────────────────────────────────────
  function newId() { return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }

  function addAlbum() {
    const id = newId();
    setProjectAlbums(prev => [...prev, { id, title: "New Album", description: "", category: "", sourceUrl: "", coverImageUrl: "", photos: [], enabled: true, displayOrder: prev.length }]);
    setExpandedAlbumId(id);
  }

  function deleteAlbum(albumId: string) {
    setProjectAlbums(prev => prev.filter(a => a.id !== albumId).map((a, i) => ({...a, displayOrder: i})));
    if (expandedAlbumId === albumId) setExpandedAlbumId(null);
  }

  function updateAlbum(albumId: string, fields: Partial<ProjectAlbum>) {
    setProjectAlbums(prev => prev.map(a => a.id === albumId ? {...a, ...fields} : a));
  }

  function moveAlbum(albumId: string, dir: -1 | 1) {
    setProjectAlbums(prev => {
      const idx = prev.findIndex(a => a.id === albumId);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr.map((a, i) => ({...a, displayOrder: i}));
    });
  }

  function addPhotoToAlbum(albumId: string, photoUrl: string) {
    const url = photoUrl.trim();
    if (!url.startsWith("http")) return;
    setProjectAlbums(prev => prev.map(a => {
      if (a.id !== albumId || a.photos.some(p => p.url === url)) return a;
      const ph: PhotoInAlbum = { id: newId(), url, alt: "", caption: "", displayOrder: a.photos.length };
      return { ...a, photos: [...a.photos, ph], coverImageUrl: a.coverImageUrl || url };
    }));
    setAlbumPhotoInputs(p => ({...p, [albumId]: ""}));
  }

  function removePhotoFromAlbum(albumId: string, photoId: string) {
    setProjectAlbums(prev => prev.map(a => {
      if (a.id !== albumId) return a;
      const removed = a.photos.find(p => p.id === photoId);
      const newPhotos = a.photos.filter(p => p.id !== photoId).map((p, i) => ({...p, displayOrder: i}));
      const newCover = a.coverImageUrl === removed?.url ? (newPhotos[0]?.url ?? "") : a.coverImageUrl;
      return { ...a, photos: newPhotos, coverImageUrl: newCover };
    }));
  }

  function setAlbumCover(albumId: string, url: string) {
    setProjectAlbums(prev => prev.map(a => a.id === albumId ? {...a, coverImageUrl: url} : a));
  }

  function movePhotoToHero(albumId: string, photoId: string, url: string) {
    removePhotoFromAlbum(albumId, photoId);
    setHeroImages(prev => prev.includes(url) ? prev : [...prev, url]);
  }

  function movePhotoBetweenAlbums(fromAlbumId: string, photoId: string, toAlbumId: string, url: string) {
    removePhotoFromAlbum(fromAlbumId, photoId);
    addPhotoToAlbum(toAlbumId, url);
  }

  async function importPhotosToAlbum(albumId: string) {
    const url = (albumUrlInputs[albumId] ?? "").trim();
    if (!url.includes("checkatrade.com")) return;
    setAlbumImportingMap(p => ({...p, [albumId]: true}));
    setAlbumMsgs(p => ({...p, [albumId]: ""}));
    try {
      const res = await fetch("/api/scrape/checkatrade-browser", {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({url}),
      });
      const data = await res.json();
      const allPhotos: string[] = Array.isArray(data.photos) ? data.photos : [];
      const guessedName: string = Array.isArray(data.galleries) && data.galleries[0]?.name ? String(data.galleries[0].name) : "";
      if (allPhotos.length === 0) {
        setAlbumMsgs(p => ({...p, [albumId]: data.error ?? "No photos found in this album."}));
        return;
      }
      const current = projectAlbums.find(a => a.id === albumId);
      const existingUrls = new Set(current?.photos.map(p => p.url) ?? []);
      const toAdd = allPhotos.filter(u => !existingUrls.has(u));
      const skipped = allPhotos.length - toAdd.length;
      setProjectAlbums(prev => prev.map(a => {
        if (a.id !== albumId) return a;
        const newPhotos: PhotoInAlbum[] = toAdd.map((u, i) => ({ id: newId(), url: u, alt: "", caption: "", displayOrder: a.photos.length + i }));
        return { ...a, title: a.title === "New Album" && guessedName ? guessedName : a.title, sourceUrl: url, coverImageUrl: a.coverImageUrl || toAdd[0] || "", photos: [...a.photos, ...newPhotos] };
      }));
      setAlbumUrlInputs(p => ({...p, [albumId]: ""}));
      setAlbumMsgs(p => ({...p, [albumId]: `✓ Imported ${toAdd.length} photos${skipped > 0 ? `. Skipped ${skipped} duplicates.` : "."}`}));
    } catch {
      setAlbumMsgs(p => ({...p, [albumId]: "Could not import photos from this album URL."}));
    } finally {
      setAlbumImportingMap(p => ({...p, [albumId]: false}));
    }
  }

  // ── Before/After pair helpers ─────────────────────────────────────────────
  function addBeforeAfterPair() {
    setBeforeAfterPairs(prev => [...prev, { id: newId(), beforeUrl: "", afterUrl: "", title: "", caption: "", category: "", displayOrder: prev.length, enabled: true }]);
  }

  function updateBeforeAfterPair(pairId: string, fields: Partial<BriefBeforeAfterPair>) {
    setBeforeAfterPairs(prev => prev.map(p => p.id === pairId ? { ...p, ...fields } : p));
  }

  function deleteBeforeAfterPair(pairId: string) {
    setBeforeAfterPairs(prev => prev.filter(p => p.id !== pairId).map((p, i) => ({ ...p, displayOrder: i })));
  }

  function moveBeforeAfterPair(pairId: string, dir: -1 | 1) {
    setBeforeAfterPairs(prev => {
      const idx = prev.findIndex(p => p.id === pairId);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr.map((p, i) => ({ ...p, displayOrder: i }));
    });
  }


  // Google Maps scraper state
  const [autoGoogleImporting, setAutoGoogleImporting] = useState(false);
  const [googleMaps, setGoogleMaps] = useState<{
    query:   string;
    runId:   string | null;
    polling: boolean;
    results: Record<string, unknown>[];
    error:   string;
  }>({
    query:   `${initialProject.name} ${initialProject.city ?? ""}`.trim(),
    runId:   null,
    polling: false,
    results: [],
    error:   "",
  });

  // Manual photo URL input
  const [photoUrlInput, setPhotoUrlInput] = useState("");

  function addPhotoByUrl() {
    const url = photoUrlInput.trim();
    if (!url || !url.startsWith("http")) return;
    setPhotos((prev) => (prev.includes(url) ? prev : [...prev, url]));
    setPhotoUrlInput("");
  }

  // Website generation
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const profit      = Number(project.budget) - Number(project.spent);
  const monthlyRate = inferMonthlyRate(project.notes);
  const cfg         = STATUS_CONFIG[project.status] ?? { label: project.status, color: "text-slate-400", bg: "bg-slate-400" };


  // ── Google Maps polling ───────────────────────────────────────────────────
  useEffect(() => {
    if (!googleMaps.runId || !googleMaps.polling) return;
    const interval = setInterval(async () => {
      try {
        const res  = await fetch(`/api/scrape/status?runId=${googleMaps.runId}`);
        const data = await res.json();
        if (data.status === "SUCCEEDED") {
          clearInterval(interval);
          setGoogleMaps((s) => ({ ...s, polling: false, results: data.items ?? [] }));
        } else if (data.status === "FAILED") {
          clearInterval(interval);
          setGoogleMaps((s) => ({ ...s, polling: false, error: "Google Maps search failed." }));
        }
      } catch {
        clearInterval(interval);
        setGoogleMaps((s) => ({ ...s, polling: false, error: "Failed to check status." }));
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [googleMaps.runId, googleMaps.polling]);

  function buildPhotosPayload(extraQa: WebsiteBriefQaPhotosJson = qaMeta) {
    return {
      ...extraQa,
      logo: logoUrl,
      heroImages,
      hero: heroImages[0] ?? "",
      primaryHeroImage: extraQa.primaryHeroImage ?? heroImages[0] ?? "",
      heroMobile: heroMobilePhoto,
      aboutImage,
      gallery: projectAlbums.flatMap(a => a.photos.map(p => p.url)),
      projectAlbums,
      heroHotspots,
      colours: brandColours,
      trustCards,
      aboutProofCards,
      reviewSettings,
      beforeAfterPairs: beforeAfterPairs.map((pair, i) => ({
        id: pair.id,
        title: pair.title ?? `Before & After ${i + 1}`,
        beforeImage: pair.beforeUrl,
        afterImage: pair.afterUrl,
        beforeUrl: pair.beforeUrl,
        afterUrl: pair.afterUrl,
        serviceCategory: pair.category ?? "General Work",
        category: pair.category,
        description: pair.caption ?? "Before and after comparison.",
        caption: pair.caption,
        displayOrder: pair.displayOrder,
        enabled: pair.enabled,
      })),
    };
  }

  function applyQaResult(result: WebsiteBriefQaResult) {
    setBrief((b) => ({
      ...b,
      phone: String(result.brief.phone ?? b.phone ?? ""),
      email: String(result.brief.email ?? b.email ?? ""),
      city: String(result.brief.city ?? b.city ?? ""),
      postcode: String(result.brief.postcode ?? b.postcode ?? ""),
      industry: String(result.brief.industry ?? b.industry ?? "trades"),
      services: String(result.brief.services ?? b.services ?? ""),
      about: String(result.brief.about ?? b.about ?? ""),
      accreditations: String(result.brief.accreditations ?? b.accreditations ?? ""),
      socialFacebook: String(result.brief.socialFacebook ?? b.socialFacebook ?? ""),
      socialInstagram: String(result.brief.socialInstagram ?? b.socialInstagram ?? ""),
      openingHours: String(result.brief.openingHours ?? b.openingHours ?? ""),
      pricingTier: (String(result.brief.pricingTier ?? b.pricingTier ?? "pro") as PricingTier),
    }));
    setHeroImages(result.photosJson.heroImages ?? []);
    setProjectAlbums((result.photosJson.projectAlbums ?? []) as ProjectAlbum[]);
    setBeforeAfterPairs((result.photosJson.beforeAfterPairs ?? []).map((pair, i) => ({
      id: pair.id,
      beforeUrl: pair.beforeUrl ?? pair.beforeImage,
      afterUrl: pair.afterUrl ?? pair.afterImage,
      title: pair.title,
      caption: pair.caption ?? pair.description,
      category: pair.category ?? pair.serviceCategory,
      displayOrder: pair.displayOrder ?? i,
      enabled: pair.enabled !== false,
    })));
    if (!brandColours.primary && !brandColours.secondary && !brandColours.tertiary && result.photosJson.suggestedBrandColours) {
      setBrandColours({
        primary: result.photosJson.suggestedBrandColours.primary,
        secondary: result.photosJson.suggestedBrandColours.secondary,
        tertiary: result.photosJson.suggestedBrandColours.background,
      });
    }
    setQaMeta({
      qaStatus: result.photosJson.qaStatus,
      qaScore: result.photosJson.qaScore,
      qaLastRunAt: result.photosJson.qaLastRunAt,
      qaWarnings: result.photosJson.qaWarnings,
      qaSuggestions: result.photosJson.qaSuggestions,
      qaChanges: result.photosJson.qaChanges,
      generatedLogo: result.photosJson.generatedLogo,
      logoSource: result.photosJson.logoSource,
      suggestedBrandColours: result.photosJson.suggestedBrandColours,
      photoCategories: result.photosJson.photoCategories,
      primaryHeroImage: result.photosJson.primaryHeroImage,
    });
  }

  async function saveQaResult(result: WebsiteBriefQaResult) {
    await fetch(`/api/projects/${project.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...result.brief, reviewsJson: JSON.stringify(reviews), photosJson: JSON.stringify(result.photosJson) }),
    });
  }

  function runBriefQaAgent({ showReview = true, applyImmediately = false } = {}) {
    setQaRunning(true);
    const result = runWebsiteBriefQaAgent({
      businessName: project.name,
      brief,
      reviews,
      photosJson: buildPhotosPayload(),
    });
    if (applyImmediately) applyQaResult(result);
    setQaReview(result);
    if (showReview) setShowQaModal(true);
    setQaRunning(false);
    return result;
  }

  useEffect(() => {
    if (!qaAfterGoogleImportPending) return;
    setQaAfterGoogleImportPending(false);
    runBriefQaAgent({ showReview: true });
    // Intentionally run once when Google import marks QA pending; runBriefQaAgent
    // reads the latest committed brief/photo/review state after the import.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qaAfterGoogleImportPending]);

  // ── Overview save ─────────────────────────────────────────────────────────
  async function saveChanges() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spent:    parseFloat(editing.spent)   || 0,
          progress: parseInt(editing.progress)  || 0,
          notes:    editing.notes,
          // also persist brief fields
          ...brief,
          reviewsJson: JSON.stringify(reviews),
          photosJson:  JSON.stringify(buildPhotosPayload()),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data    = await res.json();
      const updated = data.project ?? data;
      setProject(updated);
      onUpdate(updated);
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  // ── Brief-only save ───────────────────────────────────────────────────────
  async function saveBrief() {
    await fetch(`/api/projects/${project.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...brief, reviewsJson: JSON.stringify(reviews), photosJson: JSON.stringify(buildPhotosPayload()) }),
    });
  }

  // ── Status change ─────────────────────────────────────────────────────────
  async function changeStatus(status: string) {
    if (status === "completed") { setConfirmComplete(true); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const data    = await res.json();
      const updated = data.project ?? data;
      setProject(updated);
      onUpdate(updated);
    } catch {
      setError("Failed to update status.");
    } finally {
      setSaving(false);
    }
  }

  // ── Complete project ──────────────────────────────────────────────────────
  async function completeProject() {
    setCompleting(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status:   "completed",
          spent:    parseFloat(editing.spent) || project.spent,
          progress: 100,
          notes:    editing.notes || project.notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to complete project");
      const data    = await res.json();
      const updated = data.project ?? data;
      setProject({ ...updated, progress: 100 });
      setEditing((e) => ({ ...e, progress: "100" }));
      onUpdate({ ...updated, progress: 100 });
      setConfirmComplete(false);
      setCompleted(true);
    } catch {
      setError("Failed to complete project.");
    } finally {
      setCompleting(false);
    }
  }

  // ── Checkatrade fetch by URL ──────────────────────────────────────────────
  async function fetchCheckatrade() {
    setCheckatrade((s) => ({ ...s, loading: true, imported: false, error: "" }));
    try {
      const res  = await fetch("/api/scrape/checkatrade", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ url: checkatrade.url }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setCheckatrade((s) => ({ ...s, loading: false, error: data.error ?? "Failed to fetch page." }));
        return;
      }
      // Parse scraped data and populate the existing brief fields directly
      const parsed = parseCheckatradeImport(data as Record<string, unknown>, checkatrade.url);
      setBrief((b) => ({
        ...b,
        phone:           parsed.phone           || b.phone,
        email:           parsed.email           || b.email,
        city:            parsed.city            || b.city,
        postcode:        parsed.postcode        || b.postcode,
        services:        parsed.services        || b.services,
        about:           parsed.about           || b.about,
        accreditations:  parsed.accreditations  || b.accreditations,
        openingHours:    parsed.openingHours    || b.openingHours,
        socialFacebook:  parsed.socialFacebook  || b.socialFacebook,
        socialInstagram: parsed.socialInstagram || b.socialInstagram,
      }));
      if (parsed.newReviews.length > 0) {
        setReviews((prev) => [...prev, ...parsed.newReviews]);
      }
      if (parsed.newPhotos.length > 0) {
        // Add fast-scrape photos into a "Recent Work" album (ctBrowser may augment later)
        setProjectAlbums(prev => {
          const allExisting = new Set(prev.flatMap(a => a.photos.map(p => p.url)));
          const toAdd = parsed.newPhotos.filter(u => !allExisting.has(u));
          if (toAdd.length === 0) return prev;
          const existingAlbum = prev.find(a => a.title === "Recent Work");
          if (existingAlbum) {
            return prev.map(a => a.id !== existingAlbum.id ? a : {
              ...a,
              photos: [...a.photos, ...toAdd.map((u, i) => ({ id: newId(), url: u, alt: "", caption: "", displayOrder: a.photos.length + i }))],
              coverImageUrl: a.coverImageUrl || toAdd[0],
            });
          }
          return [...prev, { id: newId(), title: "Recent Work", description: "", category: "", sourceUrl: checkatrade.url, coverImageUrl: toAdd[0] ?? "", photos: toAdd.map((u, i) => ({ id: newId(), url: u, alt: "", caption: "", displayOrder: i })), enabled: true, displayOrder: prev.length }];
        });
      }
      setReviewSettings((s) => ({
        ...parsed.newReviewSettings,
        reviewCount:     s.reviewCount     ?? parsed.newReviewSettings.reviewCount,
        averageRating:   s.averageRating   || parsed.newReviewSettings.averageRating,
        platformUrl:     s.platformUrl     || parsed.newReviewSettings.platformUrl,
        showReviewBadge: s.showReviewBadge,
        showRatingBadge: s.showRatingBadge,
      }));

      const found = data._found as { hasNextData?: boolean; hasProfile?: boolean } | undefined;
      setCheckatrade((s) => ({
        ...s,
        loading:      false,
        imported:     true,
        rating:       data.rating      ? String(data.rating)      : s.rating,
        reviewCount:  data.reviewCount ? Number(data.reviewCount) : s.reviewCount,
        noProfile:    found && !found.hasProfile,
        serviceAreas: parsed.serviceAreas.length > 0 ? parsed.serviceAreas : s.serviceAreas,
      }));

      // Kick off ScrapingBee browser photo scrape (synchronous — waits for result)
      setCtBrowser({ loading: true, error: "" });
      try {
        const bRes  = await fetch("/api/scrape/checkatrade-browser", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ url: checkatrade.url }),
        });
        const bData = await bRes.json();
        const galleries = Array.isArray(bData.galleries)
          ? (bData.galleries as { name: string; photos: string[] }[]).filter(g => g.photos.length > 0)
          : [];
        if (galleries.length > 0) {
          setProjectAlbums(prev => {
            const existingNames = new Set(prev.map(a => a.title));
            const newAlbums: ProjectAlbum[] = galleries
              .filter(g => !existingNames.has(g.name))
              .map((g, i) => ({
                id: newId(),
                title: g.name,
                description: "", category: "",
                sourceUrl: checkatrade.url,
                coverImageUrl: g.photos[0] ?? "",
                photos: g.photos.map((url, j) => ({ id: newId(), url, alt: "", caption: "", displayOrder: j })),
                enabled: true,
                displayOrder: prev.length + i,
              }));
            return [...prev, ...newAlbums];
          });
          setCtBrowser({ loading: false, error: "" });
        } else {
          setCtBrowser({ loading: false, error: bData.error ?? "No photos found on Checkatrade." });
        }
      } catch {
        setCtBrowser({ loading: false, error: "Could not fetch photos." });
      }
    } catch {
      setCheckatrade((s) => ({ ...s, loading: false, error: "Network error. Please try again." }));
    }
  }

  // ── Google Maps search ────────────────────────────────────────────────────
  async function searchGoogleMaps() {
    setGoogleMaps((s) => ({ ...s, polling: false, runId: null, results: [], error: "" }));
    try {
      const res = await fetch("/api/scrape/google-maps", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeUrl: googleMaps.query }),
      });
      const data = await res.json();
      if (!res.ok) { setGoogleMaps((s) => ({ ...s, error: data.error ?? "Search failed." })); return; }
      setGoogleMaps((s) => ({ ...s, runId: data.runId, polling: true }));
    } catch {
      setGoogleMaps((s) => ({ ...s, error: "Network error starting search." }));
    }
  }

  async function autoImportLinkedGoogleBusiness() {
    setAutoGoogleImporting(true);
    setGoogleMaps((s) => ({ ...s, error: "" }));
    try {
      const res = await fetch(`/api/projects/${project.id}/import-google-business`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeUrl: googleMaps.query.includes("google") ? googleMaps.query : undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGoogleMaps((s) => ({ ...s, error: data.error ?? "Google Business import failed." }));
        return;
      }
      const updated = data.project as Project;
      setProject(updated);
      onUpdate(updated);
      setBrief({
        phone:           updated.phone           ?? "",
        email:           updated.email           ?? "",
        city:            updated.city            ?? "",
        postcode:        updated.postcode        ?? "",
        industry:        updated.industry        ?? "trades",
        services:        updated.services        ?? "",
        about:           updated.about           ?? "",
        accreditations:  updated.accreditations  ?? "",
        socialFacebook:  updated.socialFacebook  ?? "",
        socialInstagram: updated.socialInstagram ?? "",
        openingHours:    updated.openingHours    ?? "",
        pricingTier:     (updated.pricingTier ?? "pro") as PricingTier,
      });
      try { setReviews(JSON.parse(updated.reviewsJson ?? "[]")); } catch {}
      try {
        const raw = JSON.parse(updated.photosJson ?? "{}");
        if (Array.isArray(raw)) {
          setPhotos(raw);
        } else {
          setLogoUrl(String(raw.logo ?? ""));
          setHeroImages(Array.isArray(raw.heroImages) ? raw.heroImages : raw.hero ? [String(raw.hero)] : []);
          setHeroMobilePhoto(String(raw.heroMobile ?? ""));
          setAboutImage(String(raw.aboutImage ?? ""));
          setPhotos(Array.isArray(raw.gallery) ? raw.gallery : []);
          setProjectAlbums(Array.isArray(raw.projectAlbums) ? raw.projectAlbums : []);
          if (Array.isArray(raw.beforeAfterPairs)) setBeforeAfterPairs(raw.beforeAfterPairs as BriefBeforeAfterPair[]);
          if (raw.reviewSettings && typeof raw.reviewSettings === "object") setReviewSettings(raw.reviewSettings as ReviewSettings);
          if (Array.isArray(raw.trustCards)) setTrustCards(raw.trustCards as TrustCard[]);
          if (Array.isArray(raw.aboutProofCards)) setAboutProofCards(raw.aboutProofCards as AboutProofCard[]);
          if (raw.qaLastRunAt || raw.qaScore != null || raw.qaStatus) {
            setQaMeta({
              qaStatus: raw.qaStatus as WebsiteBriefQaPhotosJson["qaStatus"],
              qaScore: typeof raw.qaScore === "number" ? raw.qaScore : undefined,
              qaLastRunAt: typeof raw.qaLastRunAt === "string" ? raw.qaLastRunAt : undefined,
              qaWarnings: Array.isArray(raw.qaWarnings) ? raw.qaWarnings.map(String) : [],
              qaSuggestions: Array.isArray(raw.qaSuggestions) ? raw.qaSuggestions.map(String) : [],
              qaChanges: Array.isArray(raw.qaChanges) ? raw.qaChanges as WebsiteBriefQaPhotosJson["qaChanges"] : [],
              generatedLogo: raw.generatedLogo as WebsiteBriefQaPhotosJson["generatedLogo"],
              logoSource: raw.logoSource as WebsiteBriefQaPhotosJson["logoSource"],
              suggestedBrandColours: raw.suggestedBrandColours as WebsiteBriefQaPhotosJson["suggestedBrandColours"],
              photoCategories: Array.isArray(raw.photoCategories) ? raw.photoCategories as WebsiteBriefQaPhotosJson["photoCategories"] : [],
              primaryHeroImage: typeof raw.primaryHeroImage === "string" ? raw.primaryHeroImage : undefined,
            });
          }
        }
      } catch {}
      setGoogleMaps((s) => ({ ...s, query: data.placeUrl ?? s.query, error: "" }));
    } catch {
      setGoogleMaps((s) => ({ ...s, error: "Network error importing Google Business data." }));
    } finally {
      setAutoGoogleImporting(false);
    }
  }


  // ── Import everything from a Google Maps result ──────────────────────────
  function importGoogleData(item: Record<string, unknown>) {
    console.log("[Google Import] Raw Apify item:", JSON.stringify(item, null, 2));

    // Reviews
    const rawReviews = (item.reviews ?? []) as Record<string, unknown>[];
    if (Array.isArray(rawReviews) && rawReviews.length > 0) {
      const imported: Review[] = rawReviews
        .filter((r) => String(r.text ?? r.body ?? "").trim().length > 0)
        .map((r) => ({
          author: String(r.name   ?? r.author ?? "Google User"),
          rating: Number(r.stars  ?? r.rating ?? 5),
          body:   String(r.text   ?? r.body   ?? ""),
          source: "google" as const,
          date:   String(r.publishedAtDate ?? r.date ?? ""),
        }));
      if (imported.length > 0) setReviews((prev) => [...prev, ...imported]);
    }

    // reviewsTags = what customers actually mention — best source for services
    const reviewsTags = (item.reviewsTags as { title: string; count: number }[] | undefined) ?? [];

    // Services — reviewsTags first (actual treatments), then categories, skip additionalInfo (it's accessibility/amenities)
    const extractServices = (): string => {
      // Filter out generic non-service tags
      const skipTags = new Set(["knowledgeable staff", "welcoming staff", "friendly staff",
        "great service", "good service", "excellent service", "skilled team", "professional staff",
        "clear explanations", "tailored treatment", "hygienic setting", "clean environment"]);
      const treatmentTags = reviewsTags
        .filter(t => !skipTags.has(t.title.toLowerCase()))
        .sort((a, b) => b.count - a.count)
        .map(t => t.title);

      if (treatmentTags.length > 0) return treatmentTags.join("\n");

      // Fall back to categories array (all of them, not just the first)
      const cats = item.categories as string[] | undefined;
      if (Array.isArray(cats) && cats.length > 0) return cats.join("\n");

      return String(item.categoryName ?? item.category ?? "");
    };

    // About — use description first; build from available data if empty
    const buildAbout = (): string => {
      const desc = String(item.description ?? item.editorialSummary ?? item.aboutFromGoogle ?? "").trim();
      if (desc.length > 30) return desc;

      const name    = String(item.title ?? item.name ?? "");
      const city    = String(item.city  ?? "");
      const cats    = item.categories as string[] | undefined;
      const catText = Array.isArray(cats) && cats.length > 0 ? cats.slice(0, 2).join(" & ").toLowerCase() : String(item.categoryName ?? "").toLowerCase();
      const rating  = item.totalScore ?? item.rating;
      const reviews = item.reviewsCount ?? item.reviews_count;

      // Pull top treatment tags for the about sentence
      const skipTags = new Set(["knowledgeable staff", "welcoming staff", "friendly staff",
        "great service", "good service", "excellent service", "skilled team", "professional staff",
        "clear explanations", "tailored treatment", "hygienic setting", "clean environment"]);
      const topTreatments = reviewsTags
        .filter(t => !skipTags.has(t.title.toLowerCase()))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)
        .map(t => t.title);

      const parts: string[] = [];
      if (name) {
        const loc  = city ? ` based in ${city}` : "";
        const type = catText ? `, a ${catText}` : "";
        parts.push(`${name}${type}${loc}.`);
      }
      if (topTreatments.length > 0)
        parts.push(`Specialising in ${topTreatments.join(", ")}.`);
      if (rating != null && reviews != null)
        parts.push(`Rated ${Number(rating).toFixed(1)}/5 on Google with ${Number(reviews)} reviews.`);

      return parts.join(" ");
    };

    // Brief fields — only fill if not already set
    setBrief((b) => ({
      ...b,
      phone:        b.phone        || String(item.phone    ?? ""),
      city:         b.city         || String(item.city     ?? ""),
      postcode:     b.postcode     || String(item.postalCode ?? item.postCode ?? item.postal_code ?? ""),
      about:        b.about        || buildAbout(),
      services:     b.services     || extractServices(),
      openingHours: b.openingHours || (() => {
        const oh = item.openingHours as { day?: string; hours?: string }[] | undefined;
        return Array.isArray(oh) ? oh.map(h => `${h.day ?? ""}: ${h.hours ?? ""}`).join(", ") : "";
      })(),
    }));

    // Review settings from Google
    const gRating = item.totalScore ?? item.rating;
    const gCount  = item.reviewsCount ?? item.reviews_count;
    const mapsUrl = item.url ?? item.maps_url;
    if (gRating != null || gCount != null) {
      setReviewSettings((prev) => ({
        ...prev,
        platform:        "Google",
        averageRating:   gRating != null ? `${Number(gRating).toFixed(1)}/5` : prev.averageRating,
        reviewCount:     gCount  != null ? Number(gCount) : prev.reviewCount,
        platformUrl:     mapsUrl != null ? String(mapsUrl) : prev.platformUrl,
        showReviewBadge: true,
        showRatingBadge: true,
      }));
    }

    // Photos — actor returns images as {imageUrl: "..."} objects OR plain strings
    const extractUrl = (img: unknown): string | null => {
      if (typeof img === "string") return img;
      if (img && typeof img === "object") {
        const o = img as Record<string, unknown>;
        return typeof o.imageUrl === "string" ? o.imageUrl
          : typeof o.url === "string" ? o.url : null;
      }
      return null;
    };
    const imgs: string[] = [];
    if (item.imageUrl && typeof item.imageUrl === "string") imgs.push(item.imageUrl);
    for (const key of ["imageUrls", "images", "photos"] as const) {
      const arr = item[key];
      if (Array.isArray(arr)) {
        for (const img of arr) {
          const u = extractUrl(img);
          if (u && !imgs.includes(u)) imgs.push(u);
        }
      }
    }
    const newPhotos = imgs.slice(0, 20);
    if (newPhotos.length > 0) {
      const newId = () => Math.random().toString(36).slice(2, 10);
      setProjectAlbums((prev) => {
        const existing = prev.find(a => a.title === "Google Photos");
        if (existing) {
          return prev.map(a => a.id === existing.id
            ? { ...a, photos: [...a.photos, ...newPhotos.map((url, i) => ({ id: newId(), url, alt: "", caption: "", displayOrder: a.photos.length + i }))] }
            : a
          );
        }
        return [...prev, {
          id: newId(), title: "Google Photos", description: "", category: "", sourceUrl: String(mapsUrl ?? ""),
          coverImageUrl: newPhotos[0], enabled: true, displayOrder: prev.length,
          photos: newPhotos.map((url, i) => ({ id: newId(), url, alt: "", caption: "", displayOrder: i })),
        }];
      });
    }

    setQaAfterGoogleImportPending(true);
  }

  // ── Generate website ──────────────────────────────────────────────────────
  async function generateWebsite() {
    setError("");
    if (!qaMeta.qaLastRunAt || qaMeta.qaStatus === "critical_issues") {
      runBriefQaAgent({ showReview: true });
      setError("Website Brief QA has run first. Review the QA changes, save the brief, then generate the website.");
      return;
    }
    setGenerating(true);
    setGeneratedUrl(null);
    await saveBrief();
    try {
      const res = await fetch("/api/generate-website", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId:       project.id,
          businessName:    project.name,
          clientName:      project.clientName,
          industry:        brief.industry || "trades",
          city:            brief.city     || "",
          postcode:        brief.postcode || "",
          phone:           brief.phone    || "",
          email:           brief.email    || "",
          services:        brief.services || "",
          about:           brief.about    || "",
          accreditations:  brief.accreditations || "",
          socialFacebook:  brief.socialFacebook  || undefined,
          socialInstagram: brief.socialInstagram || undefined,
          rating:          reviewSettings.reviewCount ? undefined : checkatrade.rating,
          reviewCount:     reviewSettings.reviewCount ? undefined : checkatrade.reviewCount,
          reviewSettings:  {
            platform:        reviewSettings.platform || "Checkatrade",
            reviewCount:     reviewSettings.reviewCount || undefined,
            averageRating:   reviewSettings.averageRating || undefined,
            platformUrl:     reviewSettings.platformUrl || checkatrade.url || undefined,
            showReviewBadge: reviewSettings.showReviewBadge,
            showRatingBadge: reviewSettings.showRatingBadge,
          },
          notes:           [brief.openingHours].filter(Boolean).join("\n"),
          tier:            "pro_plus",
          username:        project.clientName.toLowerCase().replace(/\s+/g, "-"),
          password:        Math.random().toString(36).slice(2, 10),
          reviews,
          logoUrl:         logoUrl                   || undefined,
          heroImages:      heroImages.length > 0 ? heroImages : undefined,
          heroImage:       heroImages[0]            || undefined,
          heroMobileImage: heroMobilePhoto           || undefined,
          heroHotspots:    heroHotspots.length > 0  ? heroHotspots : undefined,
          templateId:      selectedTemplate || undefined,
          photos:          projectAlbums.filter(a => a.enabled).flatMap(a => a.photos.map(p => p.url)),
          projectAlbums:   projectAlbums.filter(a => a.enabled),
          beforeAfterPairs: beforeAfterPairs.filter(p => p.enabled && p.beforeUrl && p.afterUrl).length > 0
            ? beforeAfterPairs.filter(p => p.enabled && p.beforeUrl && p.afterUrl)
            : undefined,
          brandColours: (() => {
            const isHex = (s: string) => /^#[0-9a-fA-F]{6}$/.test(s);
            const c = {
              primary:   isHex(brandColours.primary)   ? brandColours.primary   : undefined,
              secondary: isHex(brandColours.secondary) ? brandColours.secondary : undefined,
              tertiary:  isHex(brandColours.tertiary)  ? brandColours.tertiary  : undefined,
            };
            return (c.primary || c.secondary || c.tertiary) ? c : undefined;
          })(),
          trustCards:      trustCards.filter(c => c.enabled && c.title.trim() !== ''),
          aboutProofCards: aboutProofCards.filter(c => c.enabled && c.title.trim() !== ''),
          serviceAreas:    checkatrade.serviceAreas && checkatrade.serviceAreas.length > 0 ? checkatrade.serviceAreas : undefined,
          checkatradeProfileUrl: checkatrade.url && checkatrade.url.includes('checkatrade.com') ? checkatrade.url : undefined,
        }),
      });

      const data = await res.json();
      if (data.ok) setGeneratedUrl(data.previewUrl);
      else setError(data.error ?? "Generation failed.");
    } catch {
      setError("Network error during generation.");
    } finally {
      setGenerating(false);
    }
  }

  function copyUrl() {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl glass-card rounded-2xl border border-riden-border flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-riden-border flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-white truncate">{project.name}</h2>
              <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{project.clientName || "No client"}</div>
            {/* Tab pills */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "overview"
                    ? "bg-blue-500/20 border border-blue-500/30 text-blue-400"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("brief")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "brief"
                    ? "bg-blue-500/20 border border-blue-500/30 text-blue-400"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                Website Brief
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors flex-shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === "overview" && (
          <>
            <div className="overflow-y-auto flex-1 p-5 space-y-5">

              {/* Completed success banner */}
              {completed && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4"
                >
                  <CheckCircle size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">Project completed!</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      <span className="text-white">{project.clientName}</span> is now active in your clients tab
                      with <span className="text-emerald-400">£{monthlyRate}/month</span> recurring revenue.
                    </p>
                    <Link href="/portal/clients" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors">
                      <Users size={11} /> View in Clients
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* Complete confirmation */}
              <AnimatePresence>
                {confirmComplete && !completed && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-riden-surface border border-emerald-500/20 rounded-xl p-4 space-y-3"
                  >
                    <p className="text-sm font-semibold text-white">Complete this project?</p>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      <li className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-400" /> Mark project as completed</li>
                      <li className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-400" /> Activate <span className="text-white font-medium">{project.clientName}</span> as a client</li>
                      <li className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-400" /> Set <span className="text-emerald-400 font-medium">£{monthlyRate}/month</span> recurring revenue</li>
                      <li className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-400" /> Record <span className="text-white font-medium">£{Math.max(0, Number(project.budget) - (parseFloat(editing.spent) || Number(project.spent))).toFixed(0)}</span> project profit</li>
                    </ul>
                    {error && <p className="text-xs text-rose-400">{error}</p>}
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setConfirmComplete(false)} disabled={completing}>Cancel</Button>
                      <Button variant="gradient" size="sm" onClick={completeProject} disabled={completing}>
                        {completing ? "Completing..." : "Confirm & Complete"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Key stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-riden-surface rounded-xl border border-riden-border p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1"><PoundSterling size={10} /> Budget</div>
                  <div className="text-sm font-bold text-white">{formatCurrency(Number(project.budget))}</div>
                </div>
                <div className="bg-riden-surface rounded-xl border border-riden-border p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">Spent</div>
                  <div className={`text-sm font-bold ${Number(editing.spent) > Number(project.budget) ? "text-red-400" : "text-white"}`}>
                    {formatCurrency(parseFloat(editing.spent) || 0)}
                  </div>
                </div>
                <div className="bg-riden-surface rounded-xl border border-riden-border p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1"><TrendingUp size={10} /> Profit</div>
                  <div className={`text-sm font-bold ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatCurrency(Number(project.budget) - (parseFloat(editing.spent) || Number(project.spent)))}
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>Progress</span>
                  <span className="text-white font-medium">{editing.progress}%</span>
                </div>
                <input
                  type="range" min="0" max="100"
                  value={editing.progress}
                  onChange={(e) => setEditing((p) => ({ ...p, progress: e.target.value }))}
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Editable fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Spent (£)</label>
                  <input type="number" min="0" value={editing.spent}
                    onChange={(e) => setEditing((p) => ({ ...p, spent: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Due Date</label>
                  <div className="flex items-center gap-2 bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5">
                    <Calendar size={13} className="text-slate-500 flex-shrink-0" />
                    <span className="text-sm text-white">{project.dueDate ? formatDate(project.dueDate) : "—"}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
                <textarea rows={3} value={editing.notes}
                  onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value }))}
                  className={`${inputCls} resize-none`} />
              </div>

              {/* Status */}
              <div>
                <div className="text-xs text-slate-500 mb-2">Update Status</div>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      disabled={saving || project.status === s}
                      onClick={() => changeStatus(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:cursor-not-allowed ${
                        project.status === s
                          ? `${STATUS_CONFIG[s]?.color ?? "text-white"} border border-current/30 bg-current/10`
                          : "bg-riden-muted border border-riden-border text-slate-400 hover:text-white"
                      }`}
                    >
                      {STATUS_CONFIG[s]?.label ?? s}
                    </button>
                  ))}
                </div>
              </div>

              {error && !confirmComplete && (
                <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>

            {/* Overview Footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-riden-border flex-shrink-0">
              <button
                onClick={() => { onDelete(project); onClose(); }}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Delete project
              </button>
              <div className="flex items-center gap-2">
                {project.status !== "completed" && !confirmComplete && !completed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmComplete(true)}
                    className="text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 gap-1.5"
                  >
                    <CheckCircle size={13} /> Complete
                  </Button>
                )}
                <Button variant="gradient" size="sm" onClick={saveChanges} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── Website Brief Tab ── */}
        {activeTab === "brief" && (
          <>
            <div className="overflow-y-auto flex-1 p-5 space-y-6">

              {/* Brief Form Panel */}
              <div className={`rounded-xl border p-4 space-y-3 ${briefFormStatus === "submitted" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-blue-500/5 border-blue-500/20"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-white">Client Brief Form</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {briefFormStatus === "submitted"
                        ? "The client has submitted their brief — answers are applied below."
                        : briefFormStatus === "pending"
                        ? "Form sent — waiting for the client to fill it in."
                        : "Generate a form link to send to the client. They fill it in and it populates the brief automatically."}
                    </p>
                  </div>
                  {briefFormStatus === "submitted" && (
                    <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Received ✓
                    </span>
                  )}
                  {briefFormStatus === "pending" && (
                    <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Pending
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {!briefFormToken ? (
                    <button
                      onClick={createBriefForm}
                      disabled={briefFormCreating}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                    >
                      {briefFormCreating ? <RefreshCw size={11} className="animate-spin" /> : <Plus size={11} />}
                      {briefFormCreating ? "Creating..." : "Generate form link"}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={copyBriefFormLink}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 transition-colors flex items-center gap-1.5"
                      >
                        <Copy size={11} />
                        {briefFormCopied ? "Copied!" : "Copy link"}
                      </button>
                      <a
                        href={`/brief/${briefFormToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-riden-muted border border-riden-border text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <Eye size={11} /> Preview form
                      </a>
                      {briefFormStatus === "submitted" && (
                        <button
                          onClick={reloadBriefAfterSubmit}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                        >
                          <RefreshCw size={11} /> Refresh brief
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Website Brief QA Agent Panel */}
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-white flex items-center gap-1.5"><Sparkles size={12} /> Website Brief QA Agent</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Cleans and validates the brief before website generation, without deleting photos or silently replacing important content.
                    </p>
                  </div>
                  {qaMeta.qaScore != null && (
                    <span className="px-2 py-1 rounded-lg bg-riden-muted border border-riden-border text-xs font-semibold text-violet-300">
                      QA Score {qaMeta.qaScore}/100
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => runBriefQaAgent({ showReview: true })}
                    disabled={qaRunning}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {qaRunning ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    {qaRunning ? "Running QA..." : "Run Website Brief QA"}
                  </button>
                  <span className="text-[11px] text-slate-500">
                    Last Run: {qaMeta.qaLastRunAt ? new Date(String(qaMeta.qaLastRunAt)).toLocaleString() : "Not run yet"}
                  </span>
                </div>
                {(qaMeta.qaWarnings?.length ?? 0) > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-amber-400 uppercase">Warnings</p>
                    {qaMeta.qaWarnings?.slice(0, 3).map((warning, i) => <p key={i} className="text-[11px] text-slate-400">• {warning}</p>)}
                  </div>
                )}
                {(qaMeta.qaSuggestions?.length ?? 0) > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-blue-400 uppercase">Suggestions</p>
                    {qaMeta.qaSuggestions?.slice(0, 3).map((suggestion, i) => <p key={i} className="text-[11px] text-slate-400">• {suggestion}</p>)}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div className="rounded-lg bg-riden-muted/70 border border-riden-border p-2">Photo labels: Hero Candidate · Before · After · Project Album · Needs Review · Low Quality</div>
                  <div className="rounded-lg bg-riden-muted/70 border border-riden-border p-2">Photo organisation: {qaMeta.photoCategories?.length ?? 0} photos categorised</div>
                </div>
              </div>

              {showQaModal && qaReview && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                  <div className="w-full max-w-lg rounded-2xl border border-riden-border bg-riden-surface p-5 shadow-2xl space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Review QA Changes</h3>
                        <p className="text-[11px] text-slate-400 mt-1">Score {qaReview.score.total}/100 — changes are editable and reversible. User-entered About text is preserved in aboutOriginal when cleaned.</p>
                      </div>
                      <button onClick={() => setShowQaModal(false)} className="text-slate-500 hover:text-white"><X size={16} /></button>
                    </div>
                    <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
                      <div>
                        <p className="text-[10px] font-semibold text-emerald-400 uppercase mb-1">What changed</p>
                        {qaReview.changes.map((change, i) => <p key={i} className="text-[11px] text-slate-300">• {change.summary}</p>)}
                      </div>
                      {(qaReview.score.warnings.length > 0) && <div>
                        <p className="text-[10px] font-semibold text-amber-400 uppercase mb-1">Needs review</p>
                        {qaReview.score.warnings.map((warning, i) => <p key={i} className="text-[11px] text-slate-300">• {warning}</p>)}
                      </div>}
                      {(qaReview.score.criticalIssues.length > 0) && <div>
                        <p className="text-[10px] font-semibold text-rose-400 uppercase mb-1">Critical issues</p>
                        {qaReview.score.criticalIssues.map((issue, i) => <p key={i} className="text-[11px] text-slate-300">• {issue}</p>)}
                      </div>}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => { applyQaResult(qaReview); saveQaResult(qaReview); setShowQaModal(false); }} className="px-3 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium">Accept All</button>
                      <button onClick={() => { applyQaResult(qaReview); setShowQaModal(false); }} className="px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-medium">Review Individually</button>
                      <button onClick={() => { setQaReview(null); setShowQaModal(false); }} className="px-3 py-2 rounded-lg bg-riden-muted border border-riden-border text-slate-400 text-xs font-medium">Reject Changes</button>
                      <button onClick={() => { applyQaResult(qaReview); saveQaResult(qaReview); setShowQaModal(false); }} className="px-3 py-2 rounded-lg bg-riden-muted border border-riden-border text-slate-300 text-xs font-medium">Save as Draft</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Template Selector — top of brief */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Template</h3>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(TEMPLATE_BRIEF_CONFIGS).map(([id, cfg]) => {
                    const previewUrl = templatePreviewUrl(id);
                    return (
                      <div
                        key={id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedTemplate(id)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedTemplate(id); }}
                        className={`flex items-center gap-3 w-full text-left rounded-xl border px-3 py-2.5 transition-colors cursor-pointer ${
                          selectedTemplate === id
                            ? "border-blue-500/50 bg-blue-500/10"
                            : "border-riden-border bg-riden-muted hover:border-slate-600"
                        }`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${selectedTemplate === id ? "bg-blue-500" : "bg-slate-700"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white">{cfg.label}</p>
                          <p className="text-[10px] text-slate-500 truncate">{cfg.description}</p>
                        </div>
                        {previewUrl && (
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 border border-riden-border text-slate-400 hover:text-white hover:border-blue-500/50 transition-colors"
                            title="Open a live demo of this template in a new tab"
                          >
                            Preview ↗
                          </a>
                        )}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          cfg.tier === 'Pro+' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>{cfg.tier}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Business Info */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Business Info</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1"><Phone size={10} /> Phone</label>
                    <input
                      value={brief.phone}
                      onChange={(e) => setBrief((b) => ({ ...b, phone: e.target.value }))}
                      placeholder="+44 7700 900000"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1"><Mail size={10} /> Email</label>
                    <input
                      value={brief.email}
                      onChange={(e) => setBrief((b) => ({ ...b, email: e.target.value }))}
                      placeholder="hello@business.com"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1"><MapPin size={10} /> City</label>
                    <input
                      value={brief.city}
                      onChange={(e) => setBrief((b) => ({ ...b, city: e.target.value }))}
                      placeholder="London"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Postcode</label>
                    <input
                      value={brief.postcode}
                      onChange={(e) => setBrief((b) => ({ ...b, postcode: e.target.value }))}
                      placeholder="SW1A 1AA"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Industry</label>
                    <select
                      value={brief.industry}
                      onChange={(e) => setBrief((b) => ({ ...b, industry: e.target.value }))}
                      className={inputCls}
                    >
                      {INDUSTRY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-riden-surface">{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Pricing Tier</label>
                    <select
                      value={brief.pricingTier}
                      onChange={(e) => setBrief((b) => ({ ...b, pricingTier: e.target.value as PricingTier }))}
                      className={inputCls}
                    >
                      {PRICING_TIERS.map((t) => {
                        const tier = getTier(t.id);
                        return (
                          <option key={t.id} value={t.id} className="bg-riden-surface">
                            {t.label}{t.badge ? " ★" : ""} — £{tier.setupFee} setup + £{tier.monthlyFee}/mo
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Opening Hours</label>
                    <input
                      value={brief.openingHours}
                      onChange={(e) => setBrief((b) => ({ ...b, openingHours: e.target.value }))}
                      placeholder="Mon–Fri 8am–6pm"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Services */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">{templateBriefConfig.servicesLabel}</label>
                <textarea
                  rows={3}
                  value={brief.services}
                  onChange={(e) => setBrief((b) => ({ ...b, services: e.target.value }))}
                  placeholder={templateBriefConfig.servicesPlaceholder}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* About */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">About</label>
                <textarea
                  rows={4}
                  value={brief.about}
                  onChange={(e) => setBrief((b) => ({ ...b, about: e.target.value }))}
                  placeholder="Tell us about the business, its history, and what makes it stand out..."
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Accreditations */}
              {templateBriefConfig.showAccreditations && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Accreditations & Certifications</label>
                  <input
                    value={brief.accreditations}
                    onChange={(e) => setBrief((b) => ({ ...b, accreditations: e.target.value }))}
                    placeholder="e.g. Gas Safe, NICEIC, CHAS, Which? Trusted Trader"
                    className={inputCls}
                  />
                </div>
              )}

              {/* Social Links */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1"><Globe size={11} /> Social Links</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Facebook URL</label>
                    <input
                      value={brief.socialFacebook}
                      onChange={(e) => setBrief((b) => ({ ...b, socialFacebook: e.target.value }))}
                      placeholder="https://facebook.com/..."
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Instagram URL</label>
                    <input
                      value={brief.socialInstagram}
                      onChange={(e) => setBrief((b) => ({ ...b, socialInstagram: e.target.value }))}
                      placeholder="https://instagram.com/..."
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Brand Colours */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Brand Colours</h3>
                <p className="text-[11px] text-slate-500">
                  Choose the website colour palette. Leave empty to use template defaults.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { key: "primary"   as const, label: "Primary",   hint: "Buttons & accents" },
                    { key: "secondary" as const, label: "Secondary",  hint: "Footer & dark sections" },
                    { key: "tertiary"  as const, label: "Tertiary",   hint: "Backgrounds & cards" },
                  ]).map(({ key, label, hint }) => {
                    const val   = brandColours[key];
                    const valid = val === "" || /^#[0-9a-fA-F]{6}$/.test(val);
                    return (
                      <div key={key} className="space-y-1.5">
                        <div className="text-[10px] font-semibold text-slate-300">{label}</div>
                        <div className="text-[9px] text-slate-600 leading-tight">{hint}</div>
                        <div className="flex gap-1.5 items-center">
                          {/* Colour swatch — clicking opens native colour picker */}
                          <label
                            className="relative w-8 h-8 rounded-lg overflow-hidden border flex-shrink-0 cursor-pointer"
                            style={{
                              backgroundColor: valid && val ? val : "#374151",
                              borderColor: valid && val ? val : "rgba(255,255,255,0.1)",
                            }}
                          >
                            <input
                              type="color"
                              value={valid && val ? val : "#374151"}
                              onChange={(e) => setBrandColours((c) => ({ ...c, [key]: e.target.value }))}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                          </label>
                          {/* Hex text input */}
                          <input
                            value={val}
                            onChange={(e) => {
                              let v = e.target.value.trim();
                              if (v && !v.startsWith("#")) v = "#" + v;
                              setBrandColours((c) => ({ ...c, [key]: v }));
                            }}
                            placeholder="#RRGGBB"
                            maxLength={7}
                            className={`${inputCls} !py-1.5 text-xs font-mono flex-1 min-w-0 ${!valid && val ? "border-rose-500/60" : ""}`}
                          />
                        </div>
                        {!valid && val && (
                          <p className="text-[9px] text-rose-400">Invalid hex</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trust Cards */}
              {templateBriefConfig.showTrustCards && <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Star size={11} /> Trust Cards
                  </h3>
                  <button
                    type="button"
                    onClick={() => setTrustCards(c => [...c, {
                      id:       crypto.randomUUID(),
                      title:    '',
                      value:    '',
                      icon:     'check',
                      location: ['hero', 'about'] as TrustCardLocation[],
                      enabled:  true,
                    }])}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    <Plus size={11} /> Add card
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Override the default hero value cards. Leave all disabled to show the built-in premium card set (Tailored Solutions, Direct Communication, etc).
                </p>
                <div className="space-y-1.5">
                  {trustCards.map((card, idx) => (
                    <div key={card.id} className={`border rounded-xl p-3 space-y-2 transition-colors ${card.enabled ? 'bg-riden-muted border-riden-border' : 'bg-transparent border-slate-800 opacity-50'}`}>
                      {/* Row 1: toggle · title · value · move · delete */}
                      <div className="flex items-center gap-2">
                        {/* Toggle */}
                        <button
                          type="button"
                          onClick={() => setTrustCards(cards => cards.map((c, i) => i === idx ? { ...c, enabled: !c.enabled } : c))}
                          className={`relative w-7 h-4 rounded-full flex-shrink-0 transition-colors ${card.enabled ? 'bg-blue-500' : 'bg-slate-700'}`}
                        >
                          <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${card.enabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                        </button>
                        {/* Title */}
                        <input
                          value={card.title}
                          onChange={e => setTrustCards(cards => cards.map((c, i) => i === idx ? { ...c, title: e.target.value } : c))}
                          placeholder="Card title (e.g. Fully Insured)"
                          className="flex-1 bg-transparent border-b border-slate-700 focus:border-blue-500 text-sm text-white pb-0.5 outline-none placeholder:text-slate-600"
                        />
                        {/* Value (optional) */}
                        <input
                          value={card.value}
                          onChange={e => setTrustCards(cards => cards.map((c, i) => i === idx ? { ...c, value: e.target.value } : c))}
                          placeholder="Value"
                          className="w-20 bg-transparent border-b border-slate-700 focus:border-blue-500 text-xs text-slate-300 pb-0.5 outline-none placeholder:text-slate-600 text-right"
                        />
                        {/* Move up */}
                        <button type="button" onClick={() => setTrustCards(cards => { const a = [...cards]; [a[idx-1],a[idx]] = [a[idx],a[idx-1]]; return a; })} disabled={idx === 0} className="text-slate-700 hover:text-slate-400 disabled:opacity-20 transition-colors text-xs leading-none">▲</button>
                        {/* Move down */}
                        <button type="button" onClick={() => setTrustCards(cards => { const a = [...cards]; [a[idx],a[idx+1]] = [a[idx+1],a[idx]]; return a; })} disabled={idx === trustCards.length - 1} className="text-slate-700 hover:text-slate-400 disabled:opacity-20 transition-colors text-xs leading-none">▼</button>
                        {/* Delete */}
                        <button type="button" onClick={() => setTrustCards(cards => cards.filter((_, i) => i !== idx))} className="text-slate-700 hover:text-red-400 transition-colors flex-shrink-0"><X size={13} /></button>
                      </div>
                      {/* Row 2: icon · location */}
                      <div className="flex items-center gap-3 pl-9">
                        <select
                          value={card.icon}
                          onChange={e => setTrustCards(cards => cards.map((c, i) => i === idx ? { ...c, icon: e.target.value } : c))}
                          className="text-[11px] bg-riden-surface border border-riden-border rounded-lg px-2 py-1 text-slate-300 outline-none"
                        >
                          {TRUST_CARD_ICONS.map(ic => <option key={ic} value={ic} className="bg-riden-surface">{ic}</option>)}
                        </select>
                        <span className="text-[11px] text-slate-500">Show in:</span>
                        {(['hero', 'about'] as TrustCardLocation[]).map(loc => (
                          <label key={loc} className="flex items-center gap-1 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={card.location.includes(loc)}
                              onChange={e => setTrustCards(cards => cards.map((c, i) => {
                                if (i !== idx) return c;
                                const locs = e.target.checked
                                  ? ([...c.location, loc] as TrustCardLocation[])
                                  : c.location.filter(l => l !== loc);
                                return { ...c, location: locs };
                              }))}
                              className="accent-blue-500 w-3 h-3"
                            />
                            <span className="text-[11px] text-slate-400 capitalize">{loc}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>}

              {/* About Proof Cards */}
              {templateBriefConfig.showAboutProofCards && <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Star size={11} /> About Proof Cards
                  </h3>
                  <button
                    type="button"
                    onClick={() => setAboutProofCards(c => [...c, {
                      id:       crypto.randomUUID(),
                      title:    '',
                      value:    '',
                      subtitle: '',
                      icon:     'check',
                      enabled:  true,
                    }])}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    <Plus size={11} /> Add card
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Controls the 3 stat cards in the About section (e.g. &quot;20+ yrs / Experience&quot;). If all disabled, smart defaults are used.
                </p>
                <div className="space-y-1.5">
                  {aboutProofCards.map((card, idx) => (
                    <div key={card.id} className={`border rounded-xl p-3 space-y-2 transition-colors ${card.enabled ? 'bg-riden-muted border-riden-border' : 'bg-transparent border-slate-800 opacity-50'}`}>
                      {/* Row 1: toggle · value · title · move · delete */}
                      <div className="flex items-center gap-2">
                        {/* Toggle */}
                        <button
                          type="button"
                          onClick={() => setAboutProofCards(cards => cards.map((c, i) => i === idx ? { ...c, enabled: !c.enabled } : c))}
                          className={`relative w-7 h-4 rounded-full flex-shrink-0 transition-colors ${card.enabled ? 'bg-blue-500' : 'bg-slate-700'}`}
                        >
                          <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${card.enabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                        </button>
                        {/* Value (large number / text) */}
                        <input
                          value={card.value}
                          onChange={e => setAboutProofCards(cards => cards.map((c, i) => i === idx ? { ...c, value: e.target.value } : c))}
                          placeholder="Value (e.g. 20+)"
                          className="w-24 bg-transparent border-b border-slate-700 focus:border-blue-500 text-sm text-white pb-0.5 outline-none placeholder:text-slate-600 font-mono"
                        />
                        {/* Title */}
                        <input
                          value={card.title}
                          onChange={e => setAboutProofCards(cards => cards.map((c, i) => i === idx ? { ...c, title: e.target.value } : c))}
                          placeholder="Title (e.g. Experience)"
                          className="flex-1 bg-transparent border-b border-slate-700 focus:border-blue-500 text-sm text-slate-300 pb-0.5 outline-none placeholder:text-slate-600"
                        />
                        {/* Move up */}
                        <button type="button" onClick={() => setAboutProofCards(cards => { const a = [...cards]; [a[idx-1],a[idx]] = [a[idx],a[idx-1]]; return a; })} disabled={idx === 0} className="text-slate-700 hover:text-slate-400 disabled:opacity-20 transition-colors text-xs leading-none">▲</button>
                        {/* Move down */}
                        <button type="button" onClick={() => setAboutProofCards(cards => { const a = [...cards]; [a[idx],a[idx+1]] = [a[idx+1],a[idx]]; return a; })} disabled={idx === aboutProofCards.length - 1} className="text-slate-700 hover:text-slate-400 disabled:opacity-20 transition-colors text-xs leading-none">▼</button>
                        {/* Delete */}
                        <button type="button" onClick={() => setAboutProofCards(cards => cards.filter((_, i) => i !== idx))} className="text-slate-700 hover:text-red-400 transition-colors flex-shrink-0"><X size={13} /></button>
                      </div>
                      {/* Row 2: icon · subtitle */}
                      <div className="flex items-center gap-3 pl-9">
                        <select
                          value={card.icon}
                          onChange={e => setAboutProofCards(cards => cards.map((c, i) => i === idx ? { ...c, icon: e.target.value } : c))}
                          className="text-[11px] bg-riden-surface border border-riden-border rounded-lg px-2 py-1 text-slate-300 outline-none"
                        >
                          {TRUST_CARD_ICONS.map(ic => <option key={ic} value={ic} className="bg-riden-surface">{ic}</option>)}
                        </select>
                        <input
                          value={card.subtitle}
                          onChange={e => setAboutProofCards(cards => cards.map((c, i) => i === idx ? { ...c, subtitle: e.target.value } : c))}
                          placeholder="Subtitle (e.g. Years in business)"
                          className="flex-1 bg-transparent border-b border-slate-700 focus:border-blue-500 text-[11px] text-slate-400 pb-0.5 outline-none placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>}

              {/* Checkatrade Finder */}
              {templateBriefConfig.showCheckatrade && <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-blue-400 flex items-center gap-1.5"><Search size={11} /> Import from Checkatrade</h3>
                <p className="text-[11px] text-slate-500">Paste the client&apos;s Checkatrade profile URL to auto-import their business info and reviews.</p>
                <div className="flex gap-2">
                  <input
                    value={checkatrade.url}
                    onChange={(e) => setCheckatrade((s) => ({ ...s, url: e.target.value, imported: false, error: "" }))}
                    placeholder="https://www.checkatrade.com/trades/businessname"
                    className={`${inputCls} flex-1`}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchCheckatrade}
                    disabled={checkatrade.loading || !checkatrade.url.includes("checkatrade.com")}
                    className="flex-shrink-0"
                  >
                    {checkatrade.loading ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
                  </Button>
                </div>
                {checkatrade.loading && (
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <RefreshCw size={11} className="animate-spin" /> Fetching Checkatrade profile...
                  </p>
                )}
                {checkatrade.imported && (
                  <div className="text-xs flex flex-col gap-0.5">
                    <span className={`flex items-center gap-1.5 ${checkatrade.noProfile ? "text-amber-400" : "text-emerald-400"}`}>
                      <CheckCircle size={11} />
                      {checkatrade.noProfile
                        ? "Partial import — some fields pulled from page meta only. Check fields below."
                        : "Business info, skills, and reviews imported successfully."}
                    </span>
                    {(checkatrade.rating || projectAlbums.length > 0) && (
                      <span className="text-slate-400 pl-4">
                        {checkatrade.rating && <>{checkatrade.rating}/10 · {checkatrade.reviewCount ?? 0} reviews</>}
                        {checkatrade.rating && projectAlbums.length > 0 && " · "}
                        {projectAlbums.length > 0 && <>{projectAlbums.reduce((n, a) => n + a.photos.length, 0)} photos in {projectAlbums.length} album{projectAlbums.length !== 1 ? "s" : ""}</>}
                      </span>
                    )}
                  </div>
                )}
                {ctBrowser.loading && (
                  <p className="text-xs text-blue-400 flex items-center gap-1.5">
                    <RefreshCw size={11} className="animate-spin" />
                    Fetching photos… (up to 30 s)
                  </p>
                )}
                {!ctBrowser.loading && ctBrowser.error && (
                  <p className="text-xs text-amber-400">{ctBrowser.error}</p>
                )}
                {checkatrade.error && (
                  <p className="text-xs text-rose-400">{checkatrade.error}</p>
                )}

              </div>}

              {/* Review Settings */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <Star size={11} /> Review Settings
                </h3>
                <p className="text-[11px] text-slate-500">Manual review values override any scraped data and are used as source of truth across the entire generated website.</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Platform</label>
                    <select
                      value={reviewSettings.platform}
                      onChange={e => setReviewSettings(s => ({ ...s, platform: e.target.value }))}
                      className={inputCls}
                    >
                      {["Checkatrade","Google","Trustpilot","Houzz","Rated People","Which? Trusted Traders","Other"].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Review Count (actual)</label>
                    <input
                      type="number"
                      min={0}
                      value={reviewSettings.reviewCount ?? ""}
                      onChange={e => setReviewSettings(s => ({ ...s, reviewCount: e.target.value ? parseInt(e.target.value) : undefined }))}
                      placeholder="e.g. 176"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Display Count (auto)</label>
                    <input
                      readOnly
                      value={reviewSettings.reviewCount != null ? formatReviewCount(reviewSettings.reviewCount) : ""}
                      placeholder="e.g. 170+"
                      className={`${inputCls} opacity-60 cursor-not-allowed`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Average Rating</label>
                    <input
                      value={reviewSettings.averageRating}
                      onChange={e => setReviewSettings(s => ({ ...s, averageRating: e.target.value }))}
                      placeholder="e.g. 9.69/10"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Platform URL</label>
                  <input
                    value={reviewSettings.platformUrl}
                    onChange={e => setReviewSettings(s => ({ ...s, platformUrl: e.target.value }))}
                    placeholder="e.g. https://www.checkatrade.com/trades/..."
                    className={inputCls}
                  />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reviewSettings.showReviewBadge}
                      onChange={e => setReviewSettings(s => ({ ...s, showReviewBadge: e.target.checked }))}
                      className="accent-amber-400"
                    />
                    Show Reviews Badge
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reviewSettings.showRatingBadge}
                      onChange={e => setReviewSettings(s => ({ ...s, showRatingBadge: e.target.checked }))}
                      className="accent-amber-400"
                    />
                    Show Rating Badge
                  </label>
                </div>
                {reviewSettings.reviewCount != null && (
                  <p className="text-[11px] text-amber-400/80">
                    Will display as: {formatReviewCount(reviewSettings.reviewCount)} Verified Reviews
                    {reviewSettings.averageRating && ` · ${reviewSettings.averageRating} on ${reviewSettings.platform}`}
                  </p>
                )}
              </div>

              {/* Google Maps Finder */}
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-blue-400 flex items-center gap-1.5"><Search size={11} /> Import from Google Maps</h3>
                <p className="text-[11px] text-slate-500">Find the business on Google Maps, copy the URL from your browser, and paste it here.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={autoImportLinkedGoogleBusiness}
                  disabled={autoGoogleImporting}
                  className="w-full justify-center border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                >
                  {autoGoogleImporting ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  {autoGoogleImporting ? "Importing Google Business into brief..." : "Agent: Auto-fill from linked Google Business"}
                </Button>
                <div className="flex gap-2">
                  <input
                    value={googleMaps.query}
                    onChange={(e) => setGoogleMaps((s) => ({ ...s, query: e.target.value }))}
                    placeholder="https://www.google.com/maps/place/..."
                    className={`${inputCls} flex-1`}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={searchGoogleMaps}
                    disabled={googleMaps.polling || !googleMaps.query}
                    className="flex-shrink-0"
                  >
                    {googleMaps.polling ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Search size={13} />
                    )}
                  </Button>
                </div>
                {googleMaps.polling && (
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <RefreshCw size={11} className="animate-spin" /> Searching Google Maps...
                  </p>
                )}
                {googleMaps.error && (
                  <p className="text-xs text-rose-400">{googleMaps.error}</p>
                )}
                {googleMaps.results.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {googleMaps.results.map((item, i) => (
                      <div key={i} className="bg-riden-surface rounded-lg border border-riden-border p-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-white truncate">{String(item.title ?? item.name ?? "Place")}</div>
                          {!!item.address && (
                            <div className="text-xs text-slate-500 mt-0.5 truncate">{String(item.address)}</div>
                          )}
                          {!!item.totalScore && (
                            <div className="text-xs text-slate-400 mt-0.5">★ {String(item.totalScore)} · {String(item.reviewsCount ?? 0)} reviews</div>
                          )}
                        </div>
                        <button
                          onClick={() => importGoogleData(item)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors flex-shrink-0"
                        >
                          Fill Brief
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reviews */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Star size={11} /> Reviews ({reviews.length})</h3>
                  <button
                    onClick={() => setReviews((prev) => [...prev, { author: "", rating: 5, body: "", source: "manual" }])}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    + Add Manual Review
                  </button>
                </div>
                {reviews.length === 0 && (
                  <p className="text-xs text-slate-600 text-center py-4">No reviews yet. Import from Checkatrade or Google, or add manually.</p>
                )}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {reviews.map((review, i) => (
                    <div key={i} className="bg-riden-surface rounded-xl border border-riden-border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <input
                            value={review.author}
                            onChange={(e) => {
                              const updated = [...reviews];
                              updated[i] = { ...review, author: e.target.value };
                              setReviews(updated);
                            }}
                            placeholder="Author name"
                            className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-600 focus:outline-none min-w-0"
                          />
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                            review.source === "google"
                              ? "bg-blue-500/10 text-blue-400"
                              : review.source === "checkatrade"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-slate-500/10 text-slate-400"
                          }`}>
                            {review.source === "google" ? "Google" : review.source === "checkatrade" ? "Checkatrade" : "Manual"}
                          </span>
                        </div>
                        <button
                          onClick={() => setReviews((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => {
                              const updated = [...reviews];
                              updated[i] = { ...review, rating: star };
                              setReviews(updated);
                            }}
                          >
                            <Star
                              size={13}
                              className={star <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-600"}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={2}
                        value={review.body}
                        onChange={(e) => {
                          const updated = [...reviews];
                          updated[i] = { ...review, body: e.target.value };
                          setReviews(updated);
                        }}
                        placeholder="Review text..."
                        className="w-full bg-transparent text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Company Logo */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company Logo</h3>
                <p className="text-[11px] text-slate-500">Appears top-left in the nav. PNG with transparent background works best.</p>
                {/* hidden file input */}
                <input
                  ref={logoFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                {logoUrl ? (
                  <div className="relative rounded-xl border border-riden-border bg-riden-surface flex items-center justify-center h-20 px-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoUrl} alt="Logo" className="max-h-14 max-w-full object-contain" />
                    <button
                      onClick={() => setLogoUrl("")}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => logoFileRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-riden-border bg-riden-muted text-xs text-slate-300 hover:text-white hover:border-blue-500/50 transition-colors flex-shrink-0"
                    >
                      <Upload size={12} /> Upload
                    </button>
                    <input
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="or paste a URL..."
                      className={`${inputCls} text-xs`}
                    />
                  </div>
                )}
              </div>

              {/* Hero Images — multi-image slideshow manager */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Hero Images {heroImages.length > 1 && <span className="text-blue-400 font-normal normal-case ml-1">({heroImages.length} — slideshow)</span>}
                  </h3>
                  {heroImages.length > 0 && (
                    <button onClick={() => { setHeroImages([]); setHeroHotspots([]); }} className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors">
                      Clear all
                    </button>
                  )}
                </div>

                {/* Primary image is .webp artwork */}
                {heroImages[0] && heroImages[0].split("?")[0].toLowerCase().endsWith(".webp") ? (
                  <p className="text-[11px] text-slate-500">
                    This is a <span className="text-blue-400 font-semibold">.webp artwork hero</span> — the full image replaces the normal layout. Draw clickable zones below.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Upload one or more landscape images. Multiple images rotate as a slideshow. First image is the primary / fallback.
                  </p>
                )}

                {/* Hidden multi-file input */}
                <input
                  ref={heroFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleHeroUpload}
                />

                {/* Existing images grid */}
                {heroImages.length > 0 && (
                  <div className="space-y-2">
                    {heroImages[0].split("?")[0].toLowerCase().endsWith(".webp") ? (
                      /* .webp — hotspot editor for primary image */
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <button onClick={() => heroFileRef.current?.click()} disabled={heroUploading}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-riden-border bg-riden-muted text-xs text-slate-300 hover:text-white hover:border-blue-500/50 transition-colors disabled:opacity-50">
                            {heroUploading ? <><RefreshCw size={11} className="animate-spin" /> Uploading…</> : <><Upload size={11} /> Replace</>}
                          </button>
                          <button onClick={() => { setHeroImages([]); setHeroHotspots([]); }}
                            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-rose-400 transition-colors">
                            <X size={10} /> Remove
                          </button>
                        </div>
                        <HotspotsEditor imageUrl={heroImages[0]} hotspots={heroHotspots} onChange={setHeroHotspots} />
                      </div>
                    ) : (
                      /* jpg/png grid — reorder + remove */
                      <div className="grid grid-cols-3 gap-2">
                        {heroImages.map((src, i) => (
                          <div key={src} className="relative group aspect-video rounded-lg overflow-hidden border border-riden-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`Hero ${i + 1}`} className="w-full h-full object-cover" />
                            {i === 0 && (
                              <span className="absolute top-1 left-1 text-[9px] bg-blue-500/80 text-white px-1.5 py-0.5 rounded font-semibold">Primary</span>
                            )}
                            {/* Remove */}
                            <button
                              onClick={() => setHeroImages((prev) => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <X size={9} />
                            </button>
                            {/* Reorder arrows */}
                            <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {i > 0 && (
                                <button onClick={() => setHeroImages((prev) => { const a = [...prev]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; })}
                                  className="w-5 h-5 rounded bg-black/70 text-white flex items-center justify-center text-[10px]">
                                  ←
                                </button>
                              )}
                              {i < heroImages.length - 1 && (
                                <button onClick={() => setHeroImages((prev) => { const a = [...prev]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a; })}
                                  className="w-5 h-5 rounded bg-black/70 text-white flex items-center justify-center text-[10px]">
                                  →
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Upload + URL row */}
                <div className="flex gap-2">
                  <button onClick={() => heroFileRef.current?.click()} disabled={heroUploading}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-riden-border bg-riden-muted text-xs text-slate-300 hover:text-white hover:border-blue-500/50 transition-colors flex-shrink-0 disabled:opacity-50">
                    {heroUploading ? <><RefreshCw size={12} className="animate-spin" /> Uploading…</> : <><Upload size={12} /> {heroImages.length > 0 ? "Add More" : "Upload"}</>}
                  </button>
                  <input value={heroUrlInput} onChange={(e) => setHeroUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addHeroByUrl()}
                    placeholder="or paste a URL and press Enter..." className={`${inputCls} flex-1 text-xs`} />
                  <Button variant="outline" size="sm" onClick={addHeroByUrl} disabled={!heroUrlInput.trim()}>Add</Button>
                </div>

                {heroUploadError && <p className="text-[10px] text-rose-400">{heroUploadError}</p>}
              </div>

              {/* Mobile Hero Image — only shown when desktop hero is a .webp artwork */}
              {heroImages[0] && heroImages[0].split("?")[0].toLowerCase().endsWith(".webp") && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mobile Hero Image</h3>
                  <p className="text-[11px] text-slate-500">
                    Portrait image for phones. Recommended: <span className="text-slate-300">.webp, 1080×1920 px</span>. If omitted, the desktop artwork is shown contained in a 16:9 frame on mobile.
                  </p>
                  <input
                    ref={heroMobileFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleHeroMobileUpload}
                  />
                  {heroMobilePhoto ? (
                    <div className="relative rounded-xl overflow-hidden border border-riden-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={heroMobilePhoto} alt="Mobile Hero" className="w-full h-48 object-cover object-top" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                      <button
                        onClick={() => { setHeroMobilePhoto(""); setHeroMobileUploadError(""); }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
                      >
                        <X size={11} />
                      </button>
                      <span className="absolute bottom-2 left-3 text-[10px] text-white/60">Mobile hero</span>
                      <button
                        onClick={() => heroMobileFileRef.current?.click()}
                        disabled={heroMobileUploading}
                        className="absolute bottom-2 right-3 flex items-center gap-1 text-[10px] text-white/70 hover:text-white transition-colors"
                      >
                        <Upload size={10} /> Replace
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => heroMobileFileRef.current?.click()}
                        disabled={heroMobileUploading}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-riden-border bg-riden-muted text-xs text-slate-300 hover:text-white hover:border-blue-500/50 transition-colors flex-shrink-0 disabled:opacity-50"
                      >
                        {heroMobileUploading
                          ? <><RefreshCw size={12} className="animate-spin" /> Uploading…</>
                          : <><Upload size={12} /> Upload</>
                        }
                      </button>
                      <input
                        value={heroMobilePhoto}
                        onChange={(e) => setHeroMobilePhoto(e.target.value)}
                        placeholder="or paste a URL..."
                        className={`${inputCls} text-xs`}
                      />
                    </div>
                  )}
                  {heroMobileUploadError && <p className="text-[10px] text-rose-400">{heroMobileUploadError}</p>}
                </div>
              )}

              {/* About Us Photo */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">About Us Photo</h3>
                <p className="text-[11px] text-slate-500">Team or company photo shown in the About section of the website.</p>
                {aboutImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-riden-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={aboutImage} alt="About Us" className="w-full h-48 object-cover object-center" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                    <button
                      onClick={() => setAboutImage("")}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
                    >
                      <X size={11} />
                    </button>
                    <span className="absolute bottom-2 left-3 text-[10px] text-white/60">About us photo</span>
                  </div>
                ) : (
                  <input
                    value={aboutImage}
                    onChange={(e) => setAboutImage(e.target.value)}
                    placeholder="Paste a photo URL..."
                    className={`${inputCls} text-xs`}
                  />
                )}
              </div>

              {/* Project Albums */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Project Albums ({projectAlbums.length})
                  </h3>
                  <button
                    onClick={addAlbum}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Plus size={11} /> Add Album
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Each album groups related project photos. Albums appear on the website as a sortable gallery with cover images. Import from Checkatrade album URLs or add photos manually.
                </p>

                {projectAlbums.length === 0 && (
                  <button
                    onClick={addAlbum}
                    className="w-full py-6 rounded-xl border border-dashed border-riden-border text-xs text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-colors"
                  >
                    + Add your first project album
                  </button>
                )}

                <div className="space-y-2">
                  {[...projectAlbums].sort((a, b) => a.displayOrder - b.displayOrder).map((album, idx) => (
                    <div key={album.id} className="border border-riden-border rounded-xl overflow-hidden bg-riden-surface">
                      {/* Album header row */}
                      <div className="flex items-center gap-2 p-2.5">
                        {/* Cover thumbnail */}
                        {album.coverImageUrl
                          ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={album.coverImageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-riden-border" />
                          : <div className="w-10 h-10 rounded-lg bg-riden-muted flex items-center justify-center flex-shrink-0 border border-riden-border"><FolderOpen size={14} className="text-slate-500" /></div>
                        }
                        {/* Title + meta */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">{album.title}</p>
                          <p className="text-[11px] text-slate-500">{album.photos.length} photo{album.photos.length !== 1 ? "s" : ""}{album.category ? ` · ${album.category}` : ""}</p>
                        </div>
                        {/* Controls */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => updateAlbum(album.id, {enabled: !album.enabled})}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${album.enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-riden-muted text-slate-500"}`}
                          >
                            {album.enabled ? "On" : "Off"}
                          </button>
                          <button onClick={() => moveAlbum(album.id, -1)} disabled={idx === 0} className="p-1 text-slate-500 hover:text-white disabled:opacity-25 text-xs">↑</button>
                          <button onClick={() => moveAlbum(album.id, 1)} disabled={idx === projectAlbums.length - 1} className="p-1 text-slate-500 hover:text-white disabled:opacity-25 text-xs">↓</button>
                          <button
                            onClick={() => setExpandedAlbumId(expandedAlbumId === album.id ? null : album.id)}
                            className="p-1 text-slate-400 hover:text-white text-xs"
                          >
                            {expandedAlbumId === album.id ? "▲" : "▼"}
                          </button>
                          <button onClick={() => deleteAlbum(album.id)} className="p-1 text-slate-500 hover:text-rose-400 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded editor */}
                      {expandedAlbumId === album.id && (
                        <div className="border-t border-riden-border p-3 space-y-3 bg-riden-muted/30">
                          {/* Title + Category */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400">Album Title</label>
                              <input value={album.title} onChange={e => updateAlbum(album.id, {title: e.target.value})} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-400">Category / Service</label>
                              <input value={album.category ?? ""} onChange={e => updateAlbum(album.id, {category: e.target.value})} placeholder="e.g. Bathroom, Loft..." className={inputCls} />
                            </div>
                          </div>
                          {/* Description */}
                          <div className="space-y-1">
                            <label className="text-[11px] text-slate-400">Short Description</label>
                            <textarea value={album.description ?? ""} onChange={e => updateAlbum(album.id, {description: e.target.value})} rows={2} placeholder="Briefly describe this project..." className={`${inputCls} resize-none`} />
                          </div>
                          {/* Checkatrade album import */}
                          <div className="space-y-1">
                            <label className="text-[11px] text-slate-400">Import from Checkatrade Album URL</label>
                            <div className="flex gap-2">
                              <input
                                value={albumUrlInputs[album.id] ?? ""}
                                onChange={e => setAlbumUrlInputs(p => ({...p, [album.id]: e.target.value}))}
                                onKeyDown={e => e.key === "Enter" && importPhotosToAlbum(album.id)}
                                placeholder="checkatrade.com/trades/…/albums/…"
                                className={`${inputCls} flex-1 text-xs`}
                              />
                              <button
                                onClick={() => importPhotosToAlbum(album.id)}
                                disabled={albumImportingMap[album.id] || !(albumUrlInputs[album.id] ?? "").includes("checkatrade")}
                                className="px-3 py-2 rounded-xl border border-riden-border bg-riden-muted text-xs text-slate-300 hover:text-white hover:border-blue-500/50 transition-colors disabled:opacity-40 flex-shrink-0 flex items-center gap-1.5"
                              >
                                {albumImportingMap[album.id] ? <><RefreshCw size={11} className="animate-spin" />Importing…</> : "Import"}
                              </button>
                            </div>
                            {albumMsgs[album.id] && (
                              <p className={`text-[10px] ${albumMsgs[album.id].startsWith("✓") ? "text-emerald-400" : "text-amber-400"}`}>
                                {albumMsgs[album.id]}
                              </p>
                            )}
                          </div>
                          {/* Photo grid */}
                          {album.photos.length > 0 && (
                            <div className="space-y-1.5">
                              <label className="text-[11px] text-slate-400">Photos ({album.photos.length}) — hover to move, set cover, or remove</label>
                              <div className="grid grid-cols-5 gap-1.5">
                                {album.photos.map(photo => (
                                  <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden border border-riden-border">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={photo.url} alt={photo.alt || ""} className="w-full h-full object-cover" />
                                    {(() => {
                                      const qaPhoto = photo as typeof photo & { category?: string; isHeroCandidate?: boolean; isBeforePhoto?: boolean; isAfterPhoto?: boolean; qualityScore?: number };
                                      const labels = [
                                        qaPhoto.isHeroCandidate ? "Hero Candidate" : "",
                                        qaPhoto.isBeforePhoto ? "Before" : "",
                                        qaPhoto.isAfterPhoto ? "After" : "",
                                        qaPhoto.category === "Project Album" ? "Project Album" : "",
                                        qaPhoto.category === "Poor Quality / Needs Review" ? "Needs Review" : "",
                                        (qaPhoto.qualityScore ?? 100) < 35 ? "Low Quality" : "",
                                      ].filter(Boolean);
                                      return labels.length > 0 ? (
                                        <div className="absolute top-1 left-1 flex flex-col gap-0.5 items-start">
                                          {labels.slice(0, 2).map(label => <span key={label} className="text-[8px] bg-black/70 text-white px-1 py-0.5 rounded">{label}</span>)}
                                        </div>
                                      ) : null;
                                    })()}
                                    {album.coverImageUrl === photo.url && (
                                      <div className="absolute bottom-0 left-0 right-0 bg-blue-600/80 text-[9px] text-white text-center py-0.5">Cover</div>
                                    )}
                                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                                      <button
                                        onClick={() => movePhotoToHero(album.id, photo.id, photo.url)}
                                        title="Move to Hero Images"
                                        className="w-full px-1 py-0.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-[9px] font-medium flex items-center justify-center gap-0.5"
                                      >
                                        → Hero
                                      </button>
                                      {projectAlbums.filter(a => a.id !== album.id).length > 0 && (
                                        <select
                                          defaultValue=""
                                          onChange={e => { if (e.target.value) { movePhotoBetweenAlbums(album.id, photo.id, e.target.value, photo.url); e.currentTarget.value = ""; }}}
                                          className="w-full text-[9px] bg-white/20 text-white rounded-md px-1 py-0.5 cursor-pointer"
                                          onClick={e => e.stopPropagation()}
                                        >
                                          <option value="" disabled>Move to album…</option>
                                          {projectAlbums.filter(a => a.id !== album.id).map(a => (
                                            <option key={a.id} value={a.id} className="text-slate-900 bg-white">{a.title}</option>
                                          ))}
                                        </select>
                                      )}
                                      <div className="flex gap-1 w-full">
                                        <button onClick={() => setAlbumCover(album.id, photo.url)} title="Set as cover" className="flex-1 h-5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[9px] flex items-center justify-center">⭐</button>
                                        <button onClick={() => removePhotoFromAlbum(album.id, photo.id)} title="Remove" className="flex-1 h-5 rounded-md bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center"><X size={9} /></button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Manual URL paste */}
                          <div className="space-y-1">
                            <label className="text-[11px] text-slate-400">Add Photo by URL</label>
                            <div className="flex gap-2">
                              <input
                                value={albumPhotoInputs[album.id] ?? ""}
                                onChange={e => setAlbumPhotoInputs(p => ({...p, [album.id]: e.target.value}))}
                                onKeyDown={e => e.key === "Enter" && addPhotoToAlbum(album.id, albumPhotoInputs[album.id] ?? "")}
                                placeholder="https://…"
                                className={`${inputCls} flex-1 text-xs`}
                              />
                              <button
                                onClick={() => addPhotoToAlbum(album.id, albumPhotoInputs[album.id] ?? "")}
                                disabled={!(albumPhotoInputs[album.id] ?? "").startsWith("http")}
                                className="px-3 py-2 rounded-xl border border-riden-border bg-riden-muted text-xs text-slate-300 hover:text-white disabled:opacity-40 flex-shrink-0"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {projectAlbums.length > 0 && (
                  <button
                    onClick={addAlbum}
                    className="w-full py-2 rounded-xl border border-dashed border-riden-border text-xs text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-colors"
                  >
                    + Add Album
                  </button>
                )}
              </div>

              {/* Before & After Pairs — only for transformation-led templates */}
              {templateBriefConfig.showBeforeAfter && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Before &amp; After Pairs ({beforeAfterPairs.length})
                    </h3>
                    <button
                      onClick={addBeforeAfterPair}
                      className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Plus size={11} /> Add Pair
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Pair a before photo with its after photo. Pairs appear on the website as a draggable comparison slider, with the first pair featured large. Only pairs that are On and have both photos are published.
                  </p>

                  {beforeAfterPairs.length === 0 && (
                    <button
                      onClick={addBeforeAfterPair}
                      className="w-full py-6 rounded-xl border border-dashed border-riden-border text-xs text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-colors"
                    >
                      + Add your first before &amp; after pair
                    </button>
                  )}

                  <div className="space-y-2">
                    {[...beforeAfterPairs].sort((a, b) => a.displayOrder - b.displayOrder).map((pair, idx) => (
                      <div key={pair.id} className="border border-riden-border rounded-xl bg-riden-surface p-3 space-y-3">
                        {/* Header row: title + controls */}
                        <div className="flex items-center gap-2">
                          <input
                            value={pair.title ?? ""}
                            onChange={e => updateBeforeAfterPair(pair.id, { title: e.target.value })}
                            placeholder={`Pair ${idx + 1} title (e.g. Driveway resurfacing, Solihull)`}
                            className="flex-1 bg-transparent border-b border-slate-700 focus:border-blue-500 text-xs text-white pb-0.5 outline-none placeholder:text-slate-600"
                          />
                          <button
                            onClick={() => updateBeforeAfterPair(pair.id, { enabled: !pair.enabled })}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${pair.enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-riden-muted text-slate-500"}`}
                          >
                            {pair.enabled ? "On" : "Off"}
                          </button>
                          <button onClick={() => moveBeforeAfterPair(pair.id, -1)} disabled={idx === 0} className="p-1 text-slate-500 hover:text-white disabled:opacity-25 text-xs">↑</button>
                          <button onClick={() => moveBeforeAfterPair(pair.id, 1)} disabled={idx === beforeAfterPairs.length - 1} className="p-1 text-slate-500 hover:text-white disabled:opacity-25 text-xs">↓</button>
                          <button onClick={() => deleteBeforeAfterPair(pair.id)} className="p-1 text-slate-500 hover:text-rose-400 transition-colors flex-shrink-0">
                            <X size={12} />
                          </button>
                        </div>

                        {/* Before / After slots */}
                        <div className="grid grid-cols-2 gap-2">
                          {(["beforeUrl", "afterUrl"] as const).map((field) => {
                            const label = field === "beforeUrl" ? "Before" : "After";
                            const url = pair[field];
                            return (
                              <div key={field} className="space-y-1.5">
                                <label className="text-[11px] text-slate-400 font-medium">{label}</label>
                                {url ? (
                                  <div className="relative group rounded-lg overflow-hidden border border-riden-border aspect-video">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={url} alt={`${label} photo`} className="w-full h-full object-cover" />
                                    <button
                                      onClick={() => updateBeforeAfterPair(pair.id, { [field]: "" })}
                                      className="absolute top-1 right-1 w-5 h-5 rounded-md bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                      title={`Remove ${label.toLowerCase()} photo`}
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="rounded-lg border border-dashed border-riden-border aspect-video flex items-center justify-center text-[10px] text-slate-600">
                                    No {label.toLowerCase()} photo
                                  </div>
                                )}
                                <input
                                  value={url}
                                  onChange={e => updateBeforeAfterPair(pair.id, { [field]: e.target.value.trim() })}
                                  placeholder="https://…"
                                  className={`${inputCls} text-xs`}
                                />
                                {projectAlbums.some(a => a.photos.length > 0) && (
                                  <select
                                    value=""
                                    onChange={e => { if (e.target.value) updateBeforeAfterPair(pair.id, { [field]: e.target.value }); }}
                                    className="w-full text-[11px] bg-riden-muted border border-riden-border rounded-lg px-2 py-1.5 text-slate-400 outline-none"
                                  >
                                    <option value="" disabled>Pick from albums…</option>
                                    {projectAlbums.filter(a => a.photos.length > 0).map(a => (
                                      <optgroup key={a.id} label={a.title}>
                                        {a.photos.map((p, pi) => (
                                          <option key={p.id} value={p.url} className="bg-riden-surface">
                                            {a.title} photo {pi + 1}{p.caption ? ` — ${p.caption}` : ""}
                                          </option>
                                        ))}
                                      </optgroup>
                                    ))}
                                  </select>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Category + caption */}
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={pair.category ?? ""}
                            onChange={e => updateBeforeAfterPair(pair.id, { category: e.target.value })}
                            placeholder="Category (e.g. Driveways)"
                            className={`${inputCls} text-xs`}
                          />
                          <input
                            value={pair.caption ?? ""}
                            onChange={e => updateBeforeAfterPair(pair.id, { caption: e.target.value })}
                            placeholder="Short caption (optional)"
                            className={`${inputCls} text-xs`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {beforeAfterPairs.length > 0 && (
                    <button
                      onClick={addBeforeAfterPair}
                      className="w-full py-2 rounded-xl border border-dashed border-riden-border text-xs text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-colors"
                    >
                      + Add Pair
                    </button>
                  )}
                </div>
              )}

              {/* Generated URL success panel */}
              {generatedUrl && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-2"
                >
                  <p className="text-sm font-medium text-emerald-400">Website generated!</p>
                  <a
                    href={generatedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 underline break-all"
                  >
                    {generatedUrl}
                  </a>
                  <button
                    onClick={copyUrl}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    <Copy size={11} /> {copied ? "Copied!" : "Copy URL"}
                  </button>
                </motion.div>
              )}

              {error && (
                <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>

            {/* Brief Footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-riden-border flex-shrink-0">
              <button
                onClick={() => { onDelete(project); onClose(); }}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Delete project
              </button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={saveChanges} disabled={saving}>
                  {saving ? "Saving..." : "Save Brief"}
                </Button>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={generateWebsite}
                  disabled={generating}
                  className="gap-1.5"
                >
                  {generating ? (
                    <><RefreshCw size={13} className="animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles size={13} /> Generate Website</>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ─── New Project Modal ─────────────────────────────────────────────────────────

function NewProjectModal({
  open, onClose, onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
}) {
  const [form, setForm] = useState({
    name: "", clientName: "", status: "planning",
    budget: "", spent: "", progress: "0", dueDate: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (open) {
      setForm({ name: "", clientName: "", status: "planning", budget: "", spent: "", progress: "0", dueDate: "", notes: "" });
      setError("");
    }
  }, [open]);

  async function handleSave() {
    if (!form.name.trim()) { setError("Project name is required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/projects", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:       form.name.trim(),
          clientName: form.clientName.trim(),
          status:     form.status,
          budget:     form.budget   ? Number(form.budget)   : 0,
          spent:      form.spent    ? Number(form.spent)    : 0,
          progress:   form.progress ? Number(form.progress) : 0,
          dueDate:    form.dueDate || null,
          notes:      form.notes.trim(),
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to save project."); return; }
      onSave(await res.json());
      onClose();
    } catch { setError("Network error. Please try again."); }
    finally { setSaving(false); }
  }

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }} transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg glass-card rounded-2xl border border-riden-border max-h-[90vh] overflow-y-auto portal-scroll"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-riden-border sticky top-0 bg-riden-surface z-10">
              <h2 className="text-base font-semibold text-white">New Project</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Project Name *</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Acme Corp Website" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Client Name</label>
                  <input value={form.clientName} onChange={(e) => set("clientName", e.target.value)} placeholder="Acme Corp" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="bg-riden-surface">{STATUS_CONFIG[s]?.label ?? s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Budget (£)</label>
                  <input type="number" min="0" value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="500" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Spent (£)</label>
                  <input type="number" min="0" value={form.spent} onChange={(e) => set("spent", e.target.value)} placeholder="0" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Progress ({form.progress}%)</label>
                  <input type="range" min="0" max="100" value={form.progress} onChange={(e) => set("progress", e.target.value)} className="w-full accent-blue-500 mt-1" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} className={inputCls + " [color-scheme:dark]"} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional notes..." rows={3} className={inputCls + " resize-none"} />
              </div>
              {error && <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-riden-border sticky bottom-0 bg-riden-surface">
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button variant="gradient" size="sm" onClick={handleSave} disabled={saving}>{saving ? "Creating..." : "Create Project"}</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteProjectModal({ project, onConfirm, onCancel, loading }: {
  project: Project; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }} transition={{ duration: 0.18 }}
        className="relative w-full max-w-sm glass-card rounded-2xl border border-riden-border p-6"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Delete Project</h3>
            <p className="text-xs text-slate-500">This cannot be undone</p>
          </div>
          <button onClick={onCancel} className="ml-auto p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors"><X size={14} /></button>
        </div>
        <p className="text-sm text-slate-300 mb-6">
          Delete <span className="text-white font-medium">{project.name}</span>? This will permanently remove it.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 transition-colors disabled:opacity-50">
            {loading ? "Deleting..." : "Delete Project"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [projects, setProjects]       = useState<Project[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [newOpen, setNewOpen]         = useState(false);
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [menuOpenId, setMenuOpenId]   = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const [toast, setToast]             = useState<Toast | null>(null);

  const showToast = (msg: string, type: Toast["type"]) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProjects = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch { setError("Failed to load projects."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  useEffect(() => {
    if (!menuOpenId) return;
    const handler = () => setMenuOpenId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuOpenId]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showToast(`${deleteTarget.name} was deleted.`, "success");
    } catch { showToast("Failed to delete project.", "error"); }
    finally { setDeleting(false); setDeleteTarget(null); }
  }

  const activeCount = projects.filter((p) => p.status === "in_progress").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium ${
              toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
            {toast.type === "success" ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteProjectModal project={deleteTarget} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailProject && (
          <ProjectDetailModal
            project={detailProject}
            onClose={() => setDetailProject(null)}
            onUpdate={(updated) => {
              setProjects((prev) => prev.map((p) => p.id === updated.id ? updated : p));
              setDetailProject(updated);
            }}
            onDelete={(p) => { setDetailProject(null); setDeleteTarget(p); }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">Projects</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {loading ? "Loading..." : `${projects.length} project${projects.length !== 1 ? "s" : ""}${activeCount > 0 ? ` · ${activeCount} in progress` : ""}`}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={fetchProjects}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="gradient" size="sm" onClick={() => setNewOpen(true)}>
            <Plus size={14} />
            <span className="hidden sm:inline">New Project</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          <AlertTriangle size={14} /> {error}
          <button onClick={fetchProjects} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {loading && (
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl border border-riden-border p-5 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2 flex-1"><div className="w-40 h-4 rounded bg-riden-muted" /><div className="w-24 h-3 rounded bg-riden-muted" /></div>
                <div className="w-16 h-5 rounded bg-riden-muted" />
              </div>
              <div className="w-full h-2 rounded bg-riden-muted mb-4" />
              <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((j) => <div key={j} className="h-12 rounded-lg bg-riden-muted" />)}</div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl border border-riden-border py-20 flex flex-col items-center justify-center text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-riden-muted border border-riden-border flex items-center justify-center mb-5">
            <FolderOpen size={28} className="text-slate-500" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">No projects yet</h3>
          <p className="text-sm text-slate-500 max-w-xs mb-6">Create your first project to start tracking client work, budgets, and progress.</p>
          <Button variant="gradient" size="sm" onClick={() => setNewOpen(true)}><Plus size={14} /> New Project</Button>
        </motion.div>
      )}

      {/* Project cards */}
      {!loading && projects.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          {projects.map((project, i) => {
            const cfg       = STATUS_CONFIG[project.status] ?? { label: project.status, color: "text-slate-400", bg: "bg-slate-400" };
            const budgetPct = project.budget > 0 ? Math.min(100, (project.spent / project.budget) * 100) : 0;
            const cardProfit = Number(project.budget) - Number(project.spent);

            return (
              <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                onClick={() => setDetailProject(project)}
                className="glass-card rounded-xl border border-riden-border p-5 hover:border-white/10 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white mb-0.5 truncate">{project.name}</div>
                    <div className="text-xs text-slate-500 truncate">{project.clientName || "No client"}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === project.id ? null : project.id); }}
                        className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      <AnimatePresence>
                        {menuOpenId === project.id && (
                          <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.12 }}
                            className="absolute right-0 top-9 z-30 min-w-[150px] glass-card rounded-xl border border-riden-border shadow-xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => { setDetailProject(project); setMenuOpenId(null); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                            >
                              <Eye size={13} /> View Details
                            </button>
                            <div className="h-px bg-riden-border" />
                            <button
                              onClick={() => { setDeleteTarget(project); setMenuOpenId(null); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span>Progress</span>
                    <span className="text-white font-medium">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-riden-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${project.progress}%` }} transition={{ duration: 0.8, delay: i * 0.06 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full" />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="text-center p-2 bg-riden-surface rounded-lg border border-riden-border">
                    <div className="text-xs font-bold text-white truncate">{formatCurrency(Number(project.budget))}</div>
                    <div className="text-[10px] text-slate-500">Budget</div>
                  </div>
                  <div className="text-center p-2 bg-riden-surface rounded-lg border border-riden-border">
                    <div className={`text-xs font-bold truncate ${budgetPct > 90 ? "text-red-400" : "text-white"}`}>{formatCurrency(Number(project.spent))}</div>
                    <div className="text-[10px] text-slate-500">Spent</div>
                  </div>
                  <div className="text-center p-2 bg-riden-surface rounded-lg border border-riden-border">
                    <div className={`text-xs font-bold truncate ${cardProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCurrency(cardProfit)}</div>
                    <div className="text-[10px] text-slate-500">Profit</div>
                  </div>
                </div>

                {project.notes && <p className="mt-3 text-[11px] text-slate-500 line-clamp-2">{project.notes}</p>}

                {/* Details hint */}
                <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors">
                  <Eye size={10} /> Click to view details
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <NewProjectModal open={newOpen} onClose={() => setNewOpen(false)} onSave={(p) => { setProjects((prev) => [p, ...prev]); showToast("Project created.", "success"); }} />
    </div>
  );
}
