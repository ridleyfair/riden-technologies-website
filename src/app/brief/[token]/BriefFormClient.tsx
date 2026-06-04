"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckCircle, ImagePlus, Loader2, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type DayHours = { day: string; open: boolean; hours: string };

type FormState = {
  businessName:        string;
  industry:            string;
  tradingYears:        string;
  about:               string;
  services:            string[];
  customServices:      string;
  capabilities:        string[];
  phone:               string;
  email:               string;
  city:                string;
  postcode:            string;
  openingHoursDays:    DayHours[];
  socialFacebook:      string;
  socialInstagram:     string;
  hasCheckatrade:      boolean | null;
  checkatradeUrl:      string;
  accreditations:      string[];
  customAccreditations: string;
  logoUrl:             string;
  portfolioUrls:       string[];
  extras:              string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const INDUSTRY_OPTIONS = [
  { value: "trades",       label: "Trades & Construction",  desc: "Plumber, electrician, builder, roofer, etc." },
  { value: "beauty",       label: "Beauty & Wellness",      desc: "Hair, nails, spa, beauty salon" },
  { value: "health",       label: "Health & Medical",       desc: "Dentist, physio, GP, therapist" },
  { value: "hospitality",  label: "Hospitality & Food",     desc: "Restaurant, café, catering, hotel" },
  { value: "professional", label: "Professional Services",  desc: "Solicitor, accountant, consultant" },
  { value: "retail",       label: "Retail & Products",      desc: "Shop, ecommerce, products" },
];

const SERVICES_BY_INDUSTRY: Record<string, string[]> = {
  trades: [
    "Boiler installation", "Boiler repair & servicing", "Central heating",
    "Gas safety certificates", "Emergency plumbing", "Bathroom installation",
    "Electrical installation", "Rewiring", "Fuse board upgrade",
    "CCTV & security", "Solar panels", "EV charger installation",
    "Carpentry & joinery", "Kitchen fitting", "Loft conversion",
    "Extensions & refurbishments", "Painting & decorating", "Plastering",
    "Roofing", "Flat roofing", "Guttering & fascias",
    "Landscaping & garden design", "Paving & driveways", "Decking & fencing",
    "Tiling", "General cleaning", "End-of-tenancy cleaning",
  ],
  beauty: [
    "Haircuts & styling", "Colouring & highlights", "Extensions",
    "Manicures & pedicures", "Gel & acrylic nails", "Eyelash extensions",
    "Eyebrow shaping & tinting", "Facials", "Massage",
    "Spray tanning", "Waxing", "Microblading",
  ],
  health: [
    "General dentistry", "Cosmetic dentistry", "Orthodontics",
    "Physiotherapy", "Sports massage", "Osteopathy",
    "Acupuncture", "Chiropractic", "Counselling & therapy",
    "Nutritional advice", "Personal training",
  ],
  hospitality: [
    "Dine-in restaurant", "Takeaway & delivery", "Private dining",
    "Catering for events", "Wedding catering", "Café & coffee",
    "Afternoon tea", "Corporate catering", "Food truck",
  ],
  professional: [
    "Legal advice", "Conveyancing", "Wills & probate",
    "Accounting & bookkeeping", "Tax returns", "Payroll",
    "Business consulting", "HR consulting", "IT support",
    "Marketing services", "Graphic design",
  ],
  retail: [
    "In-store shopping", "Online orders", "Click & collect",
    "Custom orders", "Wholesale", "Installation & fitting",
    "Repair & maintenance", "Subscriptions",
  ],
};

const CAPABILITIES = [
  "Free estimates", "Free quotes", "Emergency callouts",
  "24/7 availability", "Card payments accepted",
  "Insurance-approved work", "Free parking",
];

const ACCREDITATIONS: Record<string, string[]> = {
  trades: [
    "Gas Safe registered", "NICEIC approved", "NAPIT member",
    "Which? Trusted Trader", "Federation of Master Builders",
    "TrustMark registered", "CHAS accredited", "Checkatrade",
    "Local Authority approved",
  ],
  beauty:       ["VTCT qualified", "BABTAC member", "ABT member", "NVQ Level 3", "City & Guilds"],
  health:       ["GDC registered", "HCPC registered", "BMA member", "BACP accredited", "NMC registered"],
  hospitality:  ["5-star food hygiene rating", "AA Rosette", "Michelin Guide", "Visit England accredited"],
  professional: ["SRA regulated", "ICAEW member", "ACCA member", "CIMA member", "ICO registered"],
  retail:       ["ISO 9001", "BSI Kitemark", "Fair Trade certified"],
};

const DAYS: DayHours[] = [
  { day: "Monday",    open: false, hours: "" },
  { day: "Tuesday",   open: false, hours: "" },
  { day: "Wednesday", open: false, hours: "" },
  { day: "Thursday",  open: false, hours: "" },
  { day: "Friday",    open: false, hours: "" },
  { day: "Saturday",  open: false, hours: "" },
  { day: "Sunday",    open: false, hours: "" },
];

const TRADING_YEARS = ["Under 1 year", "1–3 years", "3–5 years", "5–10 years", "10–20 years", "20+ years"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <div
        onClick={onChange}
        className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors cursor-pointer ${
          checked ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white group-hover:border-blue-400"
        }`}
      >
        {checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="text-sm text-slate-700 leading-snug">{label}</span>
    </label>
  );
}

function SectionHeader({ number, title, subtitle }: { number: number; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

const inputCls =
  "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors bg-white";

// ── Main component ─────────────────────────────────────────────────────────────

export default function BriefFormClient({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Upload state
  const [logoUploading,      setLogoUploading]      = useState(false);
  const [logoUploadError,    setLogoUploadError]     = useState("");
  const [portfolioUploading, setPortfolioUploading]  = useState(false);
  const [portfolioUploadErr, setPortfolioUploadErr]  = useState("");
  const logoInputRef      = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    businessName:        "",
    industry:            "",
    tradingYears:        "",
    about:               "",
    services:            [],
    customServices:      "",
    capabilities:        [],
    phone:               "",
    email:               "",
    city:                "",
    postcode:            "",
    openingHoursDays:    DAYS.map((d) => ({ ...d })),
    socialFacebook:      "",
    socialInstagram:     "",
    hasCheckatrade:      null,
    checkatradeUrl:      "",
    accreditations:      [],
    customAccreditations: "",
    logoUrl:             "",
    portfolioUrls:       [],
    extras:              "",
  });

  useEffect(() => {
    fetch(`/api/brief-forms/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setNotFound(true); return; }
        if (data.form?.status === "submitted") { setAlreadySubmitted(true); return; }
        setForm((f) => ({ ...f, businessName: data.form?.business_name ?? "" }));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  function toggle<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => {
      const arr = f[key] as string[];
      return {
        ...f,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }

  function setDay(index: number, patch: Partial<DayHours>) {
    setForm((f) => {
      const days = f.openingHoursDays.map((d, i) => (i === index ? { ...d, ...patch } : d));
      return { ...f, openingHoursDays: days };
    });
  }

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/brief-forms/${token}/upload`, { method: "POST", body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Upload failed");
    }
    const data = await res.json() as { url: string };
    return data.url;
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setLogoUploading(true);
    setLogoUploadError("");
    try {
      const url = await uploadFile(file);
      setForm((f) => ({ ...f, logoUrl: url }));
    } catch (err) {
      setLogoUploadError((err as Error).message);
    } finally {
      setLogoUploading(false);
    }
  }

  async function handlePortfolioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";
    setPortfolioUploading(true);
    setPortfolioUploadErr("");
    try {
      const urls = await Promise.all(files.map(uploadFile));
      setForm((f) => ({ ...f, portfolioUrls: [...f.portfolioUrls, ...urls] }));
    } catch (err) {
      setPortfolioUploadErr((err as Error).message);
    } finally {
      setPortfolioUploading(false);
    }
  }

  function removePortfolioPhoto(url: string) {
    setForm((f) => ({ ...f, portfolioUrls: f.portfolioUrls.filter((u) => u !== url) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.industry) { setError("Please select your business type."); return; }
    if (!form.logoUrl)  { setError("Please upload your logo before submitting."); return; }
    if (form.portfolioUrls.length === 0) { setError("Please upload at least one portfolio photo before submitting."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/brief-forms/${token}/submit`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      if (res.status === 409) { setAlreadySubmitted(true); return; }
      if (!res.ok) throw new Error();
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const services = SERVICES_BY_INDUSTRY[form.industry] ?? [];
  const accredList = ACCREDITATIONS[form.industry] ?? [];

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Link not found</h1>
          <p className="text-slate-500 text-sm">This form link is invalid or has expired. Please contact Riden Technologies for a new link.</p>
        </div>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-sm">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Already submitted</h1>
          <p className="text-slate-500 text-sm">We&apos;ve already received your brief. Our team will be in touch soon.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-100 px-4 py-4">
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">R</span>
            </div>
            <span className="font-semibold text-slate-900 text-sm">Riden Technologies</span>
          </div>
        </header>
        <div className="flex items-center justify-center px-4 py-20">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">Thanks, {form.businessName || "we"}&apos;ve got your brief!</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Our team will review your answers and get started on your website. We&apos;ll be in touch within 1–2 business days.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">R</span>
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-sm">Riden Technologies</span>
            <p className="text-[11px] text-slate-400 leading-none mt-0.5">Website Brief Form</p>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Intro */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Tell us about {form.businessName ? `${form.businessName}` : "your business"}
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Fill in as much or as little as you like — the more you share, the better we can tailor your website. This takes around 5 minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Section 1: Business Details ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <SectionHeader number={1} title="About Your Business" />

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Business name</label>
                <input
                  value={form.businessName}
                  onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                  placeholder="e.g. Dave's Plumbing Ltd"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  What best describes your business? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        form.industry === opt.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          form.industry === opt.value ? "border-blue-600 bg-blue-600" : "border-slate-300"
                        }`}
                        onClick={() => setForm((f) => ({ ...f, industry: opt.value, services: [], accreditations: [] }))}
                      >
                        {form.industry === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div
                        onClick={() => setForm((f) => ({ ...f, industry: opt.value, services: [], accreditations: [] }))}
                        className="flex-1"
                      >
                        <p className="text-sm font-medium text-slate-900">{opt.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">How long have you been trading?</label>
                <div className="flex flex-wrap gap-2">
                  {TRADING_YEARS.map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, tradingYears: f.tradingYears === yr ? "" : yr }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        form.tradingYears === yr
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Tell us about your business
                  <span className="text-slate-400 font-normal ml-1">(in your own words)</span>
                </label>
                <textarea
                  rows={4}
                  value={form.about}
                  onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
                  placeholder="e.g. We're a family-run plumbing business based in Manchester. We've been serving local homes and businesses for over 15 years..."
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          </div>

          {/* ── Section 2: Services ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <SectionHeader number={2} title="Your Services" subtitle="Tick everything that applies to your business." />

            <div className="space-y-5">
              {services.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Services you offer</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {services.map((s) => (
                      <Checkbox
                        key={s}
                        checked={form.services.includes(s)}
                        onChange={() => toggle("services", s)}
                        label={s}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Any other services?
                  <span className="text-slate-400 font-normal ml-1">(one per line)</span>
                </label>
                <textarea
                  rows={3}
                  value={form.customServices}
                  onChange={(e) => setForm((f) => ({ ...f, customServices: e.target.value }))}
                  placeholder="e.g. Underfloor heating&#10;Smart home installation"
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Do you offer any of the following?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CAPABILITIES.map((c) => (
                    <Checkbox
                      key={c}
                      checked={form.capabilities.includes(c)}
                      onChange={() => toggle("capabilities", c)}
                      label={c}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 3: Contact & Location ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <SectionHeader number={3} title="Contact & Location" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="07700 900000"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="hello@yourbusiness.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Town / City</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="Manchester"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Postcode</label>
                <input
                  value={form.postcode}
                  onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value }))}
                  placeholder="M1 1AA"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* ── Section 4: Opening Hours ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <SectionHeader
              number={4}
              title="Opening Hours"
              subtitle="Tick the days you're open and enter your hours."
            />

            <div className="space-y-2">
              {form.openingHoursDays.map((d, i) => (
                <div key={d.day} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 w-32 cursor-pointer flex-shrink-0">
                    <div
                      onClick={() => setDay(i, { open: !d.open })}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                        d.open ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"
                      }`}
                    >
                      {d.open && (
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${d.open ? "text-slate-900 font-medium" : "text-slate-400"}`}>{d.day}</span>
                  </label>
                  <input
                    value={d.hours}
                    onChange={(e) => setDay(i, { hours: e.target.value })}
                    disabled={!d.open}
                    placeholder="e.g. 8am – 6pm"
                    className={`flex-1 border rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 ${
                      d.open
                        ? "border-slate-200 text-slate-900 placeholder:text-slate-400 bg-white"
                        : "border-slate-100 text-slate-300 placeholder:text-slate-200 bg-slate-50 cursor-not-allowed"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── Section 5: Online Presence ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <SectionHeader number={5} title="Online Presence" subtitle="Leave blank anything that doesn't apply." />

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Facebook page URL</label>
                  <input
                    value={form.socialFacebook}
                    onChange={(e) => setForm((f) => ({ ...f, socialFacebook: e.target.value }))}
                    placeholder="facebook.com/yourbusiness"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Instagram profile URL</label>
                  <input
                    value={form.socialInstagram}
                    onChange={(e) => setForm((f) => ({ ...f, socialInstagram: e.target.value }))}
                    placeholder="instagram.com/yourbusiness"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Are you on Checkatrade?</label>
                <div className="flex gap-3">
                  {[{ label: "Yes", value: true }, { label: "No", value: false }].map(({ label, value }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, hasCheckatrade: value }))}
                      className={`px-5 py-2 rounded-full text-sm font-medium border transition-colors ${
                        form.hasCheckatrade === value
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-slate-200 text-slate-600 hover:border-blue-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {form.hasCheckatrade && (
                  <input
                    value={form.checkatradeUrl}
                    onChange={(e) => setForm((f) => ({ ...f, checkatradeUrl: e.target.value }))}
                    placeholder="checkatrade.com/trades/yourbusiness"
                    className={`${inputCls} mt-3`}
                  />
                )}
              </div>

              {accredList.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Any accreditations or memberships?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {accredList.map((a) => (
                      <Checkbox
                        key={a}
                        checked={form.accreditations.includes(a)}
                        onChange={() => toggle("accreditations", a)}
                        label={a}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Any other accreditations?
                  <span className="text-slate-400 font-normal ml-1">(optional)</span>
                </label>
                <input
                  value={form.customAccreditations}
                  onChange={(e) => setForm((f) => ({ ...f, customAccreditations: e.target.value }))}
                  placeholder="e.g. ISO 9001, CHAS, Constructionline"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* ── Section 6: Photos ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <SectionHeader
              number={6}
              title="Photos"
              subtitle="These go straight onto your website — upload the best ones you have."
            />

            <div className="space-y-6">

              {/* Logo */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">
                  Your logo <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-slate-400 mb-3">Used in your website header and footer. PNG or SVG with transparent background works best.</p>

                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />

                {form.logoUrl ? (
                  <div className="relative inline-block">
                    <div className="w-40 h-24 rounded-xl border-2 border-blue-300 bg-slate-50 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.logoUrl} alt="Logo preview" className="max-w-full max-h-full object-contain p-2" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, logoUrl: "" }))}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="mt-2 text-xs text-blue-600 hover:underline block"
                    >
                      Change logo
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploading}
                    className="w-full sm:w-64 h-28 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {logoUploading ? (
                      <><Loader2 size={22} className="text-blue-500 animate-spin" /><span className="text-xs text-slate-500">Uploading...</span></>
                    ) : (
                      <><ImagePlus size={22} className="text-slate-400" /><span className="text-xs text-slate-500 font-medium">Upload logo</span><span className="text-[11px] text-slate-400">JPG, PNG or WEBP</span></>
                    )}
                  </button>
                )}
                {logoUploadError && <p className="mt-2 text-xs text-red-600">{logoUploadError}</p>}
              </div>

              {/* Portfolio photos */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">
                  Portfolio photos <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-slate-400 mb-3">
                  Photos of your work, team, or premises — these go in your website gallery. At least 1 required, up to 20.
                </p>

                <input
                  ref={portfolioInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePortfolioChange}
                />

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {form.portfolioUrls.map((url) => (
                    <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Portfolio photo" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePortfolioPhoto(url)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}

                  {form.portfolioUrls.length < 20 && (
                    <button
                      type="button"
                      onClick={() => portfolioInputRef.current?.click()}
                      disabled={portfolioUploading}
                      className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      {portfolioUploading ? (
                        <Loader2 size={18} className="text-blue-500 animate-spin" />
                      ) : (
                        <><ImagePlus size={18} className="text-slate-400" /><span className="text-[10px] text-slate-400">Add</span></>
                      )}
                    </button>
                  )}
                </div>
                {portfolioUploadErr && <p className="mt-2 text-xs text-red-600">{portfolioUploadErr}</p>}
              </div>

            </div>
          </div>

          {/* ── Section 7: Anything else ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <SectionHeader number={7} title="Anything else?" subtitle="Is there anything specific you'd like on your website or want us to know?" />

            <textarea
              rows={4}
              value={form.extras}
              onChange={(e) => setForm((f) => ({ ...f, extras: e.target.value }))}
              placeholder="e.g. We'd love a gallery of our recent jobs, and a simple contact form so customers can request a quote..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-violet-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 size={16} className="animate-spin" /> Submitting...</>
            ) : (
              "Submit my brief →"
            )}
          </button>

          <p className="text-center text-xs text-slate-400 pb-8">
            Your information is kept private and only shared with the Riden Technologies team.
          </p>
        </form>
      </div>
    </div>
  );
}
