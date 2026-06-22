"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Upload, X, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";

// ─── Trade config ────────────────────────────────────────────────────────────

type TradeConfig = {
  group: string;
  label: string;
  description: string;
  emoji: string;
  subTrades: string[];
  services: string[];
  /** Maps sub-trade name → the subset of services to show. Missing key = show all. */
  subTradeServices?: Record<string, string[]>;
  accreditations: string[];
  photoCategories: string[];
  templateId: string;
};

const TRADES: TradeConfig[] = [
  {
    group: "emergency",
    label: "Emergency Services",
    description: "24/7 gas leaks, boiler breakdowns, burst pipes & drain emergencies",
    emoji: "🚨",
    subTrades: ["Gas engineer", "Emergency plumber", "Drain specialist", "Heating engineer", "Boiler specialist", "Locksmith"],
    services: [
      "24/7 emergency call-outs",
      "Gas leak detection & repair",
      "Gas safety inspections",
      "Landlord gas safety certificate",
      "Carbon monoxide testing",
      "Gas cooker installation",
      "Gas fire installation",
      "Boiler installation",
      "Boiler emergency repair",
      "Boiler service & maintenance",
      "Annual boiler service",
      "Boiler replacement",
      "Boiler controls upgrade",
      "System power flush",
      "Central heating installation",
      "Radiator installation & repair",
      "Underfloor heating installation",
      "Thermostat & controls installation",
      "Heat pump installation",
      "Emergency heating restoration",
      "Burst pipe repair",
      "Water leak detection",
      "Emergency tap repair",
      "Overflowing toilet repair",
      "Frozen pipe repair",
      "Drain unblocking",
      "CCTV drain surveys",
      "High pressure drain jetting",
      "Drain lining & relining",
      "Drain excavation & repair",
      "Septic tank emptying",
      "Emergency lock opening",
      "Lock replacement & upgrade",
      "Key cutting",
      "UPVC door repair",
      "Window lock repair",
      "Security assessment",
    ],
    subTradeServices: {
      "Gas engineer":      ["24/7 emergency call-outs", "Gas leak detection & repair", "Gas safety inspections", "Landlord gas safety certificate", "Carbon monoxide testing", "Gas cooker installation", "Gas fire installation", "Boiler installation", "Boiler emergency repair", "Boiler service & maintenance", "Central heating installation", "Emergency heating restoration"],
      "Emergency plumber": ["24/7 emergency call-outs", "Burst pipe repair", "Water leak detection", "Emergency tap repair", "Overflowing toilet repair", "Frozen pipe repair", "Drain unblocking", "CCTV drain surveys"],
      "Drain specialist":  ["Drain unblocking", "CCTV drain surveys", "High pressure drain jetting", "Drain lining & relining", "Drain excavation & repair", "Septic tank emptying", "24/7 emergency call-outs"],
      "Heating engineer":  ["Central heating installation", "Boiler installation", "Boiler service & maintenance", "Radiator installation & repair", "Underfloor heating installation", "Thermostat & controls installation", "Heat pump installation", "Emergency heating restoration", "System power flush", "24/7 emergency call-outs"],
      "Boiler specialist": ["Boiler installation", "Boiler emergency repair", "Boiler service & maintenance", "Annual boiler service", "Boiler replacement", "Boiler controls upgrade", "System power flush", "Gas safety inspections", "Emergency heating restoration", "24/7 emergency call-outs"],
      "Locksmith":         ["Emergency lock opening", "Lock replacement & upgrade", "Key cutting", "UPVC door repair", "Window lock repair", "Security assessment", "24/7 emergency call-outs"],
    },
    accreditations: ["Gas Safe registered", "OFTEC registered", "Checkatrade member", "TrustMark registered", "Which? Trusted Trader"],
    photoCategories: ["Emergency callouts", "Boiler installations", "Heating systems", "Drain work", "Before & after"],
    templateId: "emergency-trade",
  },
  {
    group: "reno",
    label: "Plumber / Electrician / Builder",
    description: "Bathrooms, kitchens, rewires, extensions, roofing & more",
    emoji: "🔧",
    subTrades: [
      "Plumber", "Electrician", "Builder", "General contractor", "Roofer",
      "Kitchen fitter", "Bathroom fitter", "Loft conversion specialist", "Drain specialist",
    ],
    services: [
      "Bathroom installation",
      "En-suite installation",
      "Wet room installation",
      "Walk-in shower installation",
      "Freestanding bath installation",
      "Toilet installation",
      "Basin & sink installation",
      "Kitchen plumbing",
      "Outside tap fitting",
      "Leak detection & repair",
      "Pipe lagging",
      "Stopcock replacement",
      "Water softener installation",
      "Drain unblocking",
      "Full rewire",
      "Consumer unit upgrade",
      "EV charger installation",
      "Smart home / lighting",
      "Socket & switch installation",
      "Outdoor & security lighting",
      "CCTV installation",
      "Fire alarm installation",
      "PAT testing",
      "Bathroom electrics",
      "LED lighting upgrade",
      "Solar panel connection",
      "Extensions & conversions",
      "Loft conversions",
      "Dormer loft conversion",
      "Hip-to-gable conversion",
      "Garage conversion",
      "Basement conversion",
      "New builds & refurbishments",
      "Structural work",
      "Brickwork & pointing",
      "Damp proofing",
      "Groundwork",
      "Roof replacement & repair",
      "Flat roofing",
      "Guttering & fascias",
      "Velux / skylight installation",
      "Chimney repairs",
      "Lead work",
      "EPDM rubber roofing",
      "GRP fibreglass roofing",
      "Kitchen installation",
      "Worktop fitting",
      "Appliance installation",
      "Kitchen cabinet fitting",
      "Island unit installation",
      "Tiling",
    ],
    subTradeServices: {
      "Plumber":                    ["Bathroom installation", "En-suite installation", "Wet room installation", "Walk-in shower installation", "Freestanding bath installation", "Toilet installation", "Basin & sink installation", "Kitchen plumbing", "Outside tap fitting", "Leak detection & repair", "Pipe lagging", "Stopcock replacement", "Water softener installation", "Drain unblocking"],
      "Electrician":                ["Full rewire", "Consumer unit upgrade", "EV charger installation", "Smart home / lighting", "Socket & switch installation", "Outdoor & security lighting", "CCTV installation", "Fire alarm installation", "PAT testing", "Bathroom electrics", "LED lighting upgrade", "Solar panel connection"],
      "Builder":                    ["Extensions & conversions", "Loft conversions", "Garage conversion", "Basement conversion", "New builds & refurbishments", "Structural work", "Brickwork & pointing", "Damp proofing", "Groundwork", "Roof replacement & repair", "Flat roofing"],
      "General contractor":         [],
      "Roofer":                     ["Roof replacement & repair", "Flat roofing", "Guttering & fascias", "Velux / skylight installation", "Chimney repairs", "Lead work", "EPDM rubber roofing", "GRP fibreglass roofing"],
      "Kitchen fitter":             ["Kitchen installation", "Worktop fitting", "Appliance installation", "Kitchen cabinet fitting", "Island unit installation", "Kitchen plumbing", "Tiling"],
      "Bathroom fitter":            ["Bathroom installation", "En-suite installation", "Wet room installation", "Walk-in shower installation", "Freestanding bath installation", "Tiling", "Toilet installation", "Basin & sink installation", "Leak detection & repair"],
      "Loft conversion specialist": ["Loft conversions", "Dormer loft conversion", "Hip-to-gable conversion", "Extensions & conversions", "Structural work", "Velux / skylight installation"],
      "Drain specialist":           ["Drain unblocking", "Leak detection & repair", "Pipe lagging"],
    },
    accreditations: ["Gas Safe registered", "NICEIC approved", "Part P certified", "FMB member", "NFRC member", "Checkatrade member", "TrustMark registered"],
    photoCategories: ["Before & after", "Bathroom & kitchen", "Electrical work", "Extensions & builds", "Completed projects"],
    templateId: "reno-showcase",
  },
  {
    group: "outdoor",
    label: "Landscaper / Gardener / Driveways",
    description: "Gardens, patios, driveways, fencing & outdoor transformations",
    emoji: "🌿",
    subTrades: ["Landscaper", "Gardener", "Driveway & paving specialist", "Tree surgeon", "Fencing contractor", "Artificial grass installer"],
    services: [
      "Garden design & landscaping",
      "Planting & soft landscaping",
      "Lawn installation & turfing",
      "Lawn care & maintenance",
      "Garden maintenance",
      "Garden clearance",
      "Driveway installation",
      "Block paving",
      "Resin bound driveway",
      "Tarmac driveway",
      "Concrete driveway",
      "Patio installation",
      "Decking installation",
      "Composite decking",
      "Raised decking",
      "Fencing installation",
      "Gates & automated gates",
      "Retaining walls",
      "Garden walling",
      "Steps & pathways",
      "Tree surgery",
      "Tree removal",
      "Hedge trimming & shaping",
      "Stump removal & grinding",
      "Artificial grass installation",
      "Irrigation & water features",
      "Pond design & installation",
      "Outdoor lighting",
      "Raised beds & vegetable gardens",
      "Garden rooms & summer houses",
      "Pressure washing",
      "Jet washing",
    ],
    accreditations: ["Arborist certified", "Marshalls approved", "ICB certified", "Checkatrade member", "TrustMark registered"],
    photoCategories: ["Before & after", "Garden designs", "Driveways & paving", "Decking & patios", "Completed projects"],
    templateId: "outdoor-transform",
  },
  {
    group: "decor",
    label: "Painter / Decorator / Plasterer",
    description: "Interior & exterior painting, plastering, tiling & finishing",
    emoji: "🎨",
    subTrades: ["Painter & decorator", "Plasterer", "Skim & render specialist", "Floor fitter", "Tiler", "Window fitter"],
    services: [
      "Interior painting",
      "Exterior painting",
      "Wallpapering",
      "Feature wall installation",
      "Furniture & cabinet painting",
      "Kitchen painting",
      "Staircase painting",
      "Commercial decorating",
      "New build decoration",
      "Property maintenance painting",
      "Spray painting",
      "Full plastering",
      "Skim coating",
      "Rendering",
      "External rendering",
      "Pebbledash removal",
      "Venetian plaster",
      "Microcement coating",
      "Coving & cornicing",
      "Tiling",
      "Wet room tiling",
      "Kitchen splashback tiling",
      "Floor tiling",
      "Floor fitting",
      "Laminate flooring",
      "Engineered wood flooring",
      "Luxury vinyl tile (LVT)",
      "Carpet fitting",
      "Window fitting",
      "Door hanging & fitting",
      "Skirting & architrave fitting",
    ],
    accreditations: ["Dulux Select Decorator", "Checkatrade member", "TrustMark registered", "Which? Trusted Trader", "PCA member"],
    photoCategories: ["Before & after", "Interior work", "Exterior work", "Commercial projects", "Plastering & rendering"],
    templateId: "finish-decor",
  },
];

// ─── Types ───────────────────────────────────────────────────────────────────

type Photo = { url: string; category: string; filename: string };

type FormState = {
  tradeGroup: string;
  subTrade: string;
  businessName: string;
  city: string;
  postcode: string;
  phone: string;
  email: string;
  existingWebsite: string;
  services: string[];
  accreditations: string[];
  emergencyCallouts: boolean;
  emergencyPhone: string;
  serviceAreas: string;
  yearsTrading: string;
  googleRating: string;
  googleReviewCount: string;
  checkatradeProfile: string;
  description: string;
  photos: Photo[];
};

const EMPTY: FormState = {
  tradeGroup: "",
  subTrade: "",
  businessName: "",
  city: "",
  postcode: "",
  phone: "",
  email: "",
  existingWebsite: "",
  services: [],
  accreditations: [],
  emergencyCallouts: false,
  emergencyPhone: "",
  serviceAreas: "",
  yearsTrading: "",
  googleRating: "",
  googleReviewCount: "",
  checkatradeProfile: "",
  description: "",
  photos: [],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

function currentTrade(form: FormState): TradeConfig | undefined {
  return TRADES.find((t) => t.group === form.tradeGroup);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-slate-400 mb-2">
        <span>Step {step} of {total}</span>
        <span>{Math.round((step / total) * 100)}% complete</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
          initial={false}
          animate={{ width: `${(step / total) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}

function CheckPill({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all text-left ${
        checked
          ? "border-blue-500 bg-blue-500/10 text-white"
          : "border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-400"
      }`}
    >
      <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${checked ? "border-blue-500 bg-blue-500" : "border-slate-500"}`}>
        {checked && <CheckCircle2 size={12} className="text-white" />}
      </span>
      {label}
    </button>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors";

// ─── Steps ───────────────────────────────────────────────────────────────────

function StepTrade({ form, set }: { form: FormState; set: (f: Partial<FormState>) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">What&apos;s your trade?</h2>
      <p className="text-slate-400 mb-6">We&apos;ll tailor the questions to get your website brief exactly right.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TRADES.map((trade) => (
          <button
            key={trade.group}
            type="button"
            onClick={() => set({ tradeGroup: trade.group, subTrade: "", services: [], accreditations: [] })}
            className={`flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
              form.tradeGroup === trade.group
                ? "border-blue-500 bg-blue-500/10"
                : "border-slate-700 bg-slate-800/50 hover:border-slate-500"
            }`}
          >
            <span className="text-3xl flex-shrink-0">{trade.emoji}</span>
            <div>
              <div className="font-semibold text-white leading-tight">{trade.label}</div>
              <div className="text-xs text-slate-400 mt-1 leading-relaxed">{trade.description}</div>
            </div>
            {form.tradeGroup === trade.group && (
              <CheckCircle2 size={20} className="text-blue-400 ml-auto flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepBusiness({ form, set }: { form: FormState; set: (f: Partial<FormState>) => void }) {
  const trade = currentTrade(form)!;
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Business details</h2>
      <p className="text-slate-400 mb-6">Basic info that goes on your website.</p>
      <div className="space-y-4">
        <Field label="Business name" required>
          <select className={inputCls} value={form.subTrade} onChange={e => set({ subTrade: e.target.value, services: [] })}>
            <option value="">Select your specific trade…</option>
            {trade.subTrades.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Business / trading name" required>
          <input className={inputCls} placeholder="e.g. Smith's Plumbing Ltd" value={form.businessName} onChange={e => set({ businessName: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Town / city" required>
            <input className={inputCls} placeholder="e.g. Manchester" value={form.city} onChange={e => set({ city: e.target.value })} />
          </Field>
          <Field label="Postcode">
            <input className={inputCls} placeholder="e.g. M1 1AA" value={form.postcode} onChange={e => set({ postcode: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone number" required>
            <input className={inputCls} type="tel" placeholder="07700 000000" value={form.phone} onChange={e => set({ phone: e.target.value })} />
          </Field>
          <Field label="Email address" required>
            <input className={inputCls} type="email" placeholder="you@example.com" value={form.email} onChange={e => set({ email: e.target.value })} />
          </Field>
        </div>
        <Field label="Existing website (if you have one)">
          <input className={inputCls} type="url" placeholder="https://…" value={form.existingWebsite} onChange={e => set({ existingWebsite: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}

const DESC_MIN = 200;

function StepTradeQuestions({ form, set }: { form: FormState; set: (f: Partial<FormState>) => void }) {
  const trade = currentTrade(form)!;
  const [customInput, setCustomInput] = useState("");

  // Filter services by sub-trade when a mapping exists; empty array means show all
  const subMap = trade.subTradeServices?.[form.subTrade];
  const visibleServices = subMap && subMap.length > 0 ? subMap : trade.services;

  // Custom services = selected items not in the preset list
  const customServices = form.services.filter(s => !trade.services.includes(s));

  function addCustomService() {
    const trimmed = customInput.trim();
    if (!trimmed || form.services.includes(trimmed)) return;
    set({ services: [...form.services, trimmed] });
    setCustomInput("");
  }

  const descLen = form.description.length;
  const descOk  = descLen >= DESC_MIN;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Your services</h2>
      <p className="text-slate-400 mb-6">Tick everything you offer — this builds your services page automatically.</p>
      <div className="space-y-6">
        {/* Emergency contact — shown for all trades */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div>
              <div className="font-medium text-white text-sm">Do you offer emergency callouts?</div>
              <div className="text-xs text-slate-400 mt-0.5">We&apos;ll display a 24/7 emergency number prominently on your site</div>
            </div>
            <button
              type="button"
              onClick={() => set({ emergencyCallouts: !form.emergencyCallouts, emergencyPhone: form.emergencyCallouts ? "" : form.emergencyPhone })}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 overflow-hidden ${form.emergencyCallouts ? "bg-blue-500" : "bg-slate-600"}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.emergencyCallouts ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
          {form.emergencyCallouts && (
            <div className="px-4 pb-4 border-t border-slate-700 pt-3">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Emergency contact number <span className="text-red-400">*</span>
              </label>
              <input
                className={inputCls}
                type="tel"
                placeholder="e.g. 07700 000000 (can be same as main number)"
                value={form.emergencyPhone}
                onChange={e => set({ emergencyPhone: e.target.value })}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">Services you offer</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {visibleServices.map(s => (
              <CheckPill
                key={s}
                label={s}
                checked={form.services.includes(s)}
                onClick={() => set({ services: toggle(form.services, s) })}
              />
            ))}
          </div>

          {/* Custom services added by user */}
          {customServices.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-700">
              {customServices.map(s => (
                <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-sm">
                  {s}
                  <button
                    type="button"
                    onClick={() => set({ services: form.services.filter(x => x !== s) })}
                    className="text-blue-400 hover:text-white transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add custom service */}
          <div className="flex gap-2 mt-3">
            <input
              className={`${inputCls} flex-1`}
              placeholder="Add a service not listed above…"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomService(); } }}
            />
            <button
              type="button"
              onClick={addCustomService}
              disabled={!customInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex-shrink-0"
            >
              Add
            </button>
          </div>
        </div>

        <Field label="Areas you cover">
          <input
            className={inputCls}
            placeholder="e.g. Manchester, Salford, Stretford, Trafford"
            value={form.serviceAreas}
            onChange={e => set({ serviceAreas: e.target.value })}
          />
        </Field>

        <Field label="Accreditations & memberships">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {trade.accreditations.map(a => (
              <CheckPill
                key={a}
                label={a}
                checked={form.accreditations.includes(a)}
                onClick={() => set({ accreditations: toggle(form.accreditations, a) })}
              />
            ))}
          </div>
        </Field>

        <Field label="Tell us a bit about your business">
          <textarea
            className={`${inputCls} h-28 resize-none ${!descOk && descLen > 0 ? "border-amber-500/60" : ""}`}
            placeholder="How long have you been trading? What makes you different? Any specialisms? What area do you cover? Tell us anything that helps us write your website copy."
            value={form.description}
            onChange={e => set({ description: e.target.value })}
          />
          <div className={`flex justify-between text-xs mt-1 ${descOk ? "text-green-400" : descLen > 0 ? "text-amber-400" : "text-slate-500"}`}>
            <span>{descOk ? "✓ Great, that’s enough detail" : `Minimum ${DESC_MIN} characters — helps us write better copy`}</span>
            <span>{descLen} / {DESC_MIN}</span>
          </div>
        </Field>
      </div>
    </div>
  );
}

function StepTrust({ form, set }: { form: FormState; set: (f: Partial<FormState>) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Reviews & trust signals</h2>
      <p className="text-slate-400 mb-6">These show on your website to build trust with new customers.</p>
      <div className="space-y-4">
        <Field label="Years in business">
          <select className={inputCls} value={form.yearsTrading} onChange={e => set({ yearsTrading: e.target.value })}>
            <option value="">Select…</option>
            {["Less than 1 year","1–2 years","3–5 years","6–10 years","10–20 years","20+ years"].map(v => <option key={v}>{v}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Google rating">
            <select className={inputCls} value={form.googleRating} onChange={e => set({ googleRating: e.target.value })}>
              <option value="">Not sure / none</option>
              {["5.0","4.9","4.8","4.7","4.6","4.5","4.4","4.3","4.2","4.0"].map(v => <option key={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Number of Google reviews">
            <input
              className={inputCls}
              type="number"
              min="0"
              placeholder="e.g. 47"
              value={form.googleReviewCount}
              onChange={e => set({ googleReviewCount: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Checkatrade profile URL (if you have one)">
          <input
            className={inputCls}
            type="url"
            placeholder="https://www.checkatrade.com/trades/…"
            value={form.checkatradeProfile}
            onChange={e => set({ checkatradeProfile: e.target.value })}
          />
        </Field>

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-sm text-slate-400">
          💡 Don&apos;t worry if you don&apos;t have these yet — we can always add them later once your website is live.
        </div>
      </div>
    </div>
  );
}

function StepPhotos({ form, set }: { form: FormState; set: (f: Partial<FormState>) => void }) {
  const trade = currentTrade(form)!;
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(trade.photoCategories[0]);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const newPhotos: Photo[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 10 * 1024 * 1024) continue;
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/universal-brief/upload", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json() as { url: string };
          newPhotos.push({ url: data.url, category: selectedCategory, filename: file.name });
        }
      } catch { /* skip failed uploads */ }
    }
    set({ photos: [...form.photos, ...newPhotos] });
    setUploading(false);
  }, [form.photos, selectedCategory, set]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    uploadFiles(e.dataTransfer.files);
  }, [uploadFiles]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Work photos</h2>
      <p className="text-slate-400 mb-6">Upload your best photos — we&apos;ll organise them into albums on your website automatically.</p>

      <div className="space-y-4">
        <Field label="Photo category">
          <div className="flex flex-wrap gap-2">
            {trade.photoCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                  selectedCategory === cat
                    ? "border-blue-500 bg-blue-500/10 text-white"
                    : "border-slate-600 text-slate-400 hover:border-slate-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1.5">Select a category, then upload photos for it</p>
        </Field>

        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-slate-600 rounded-2xl p-8 text-center cursor-pointer hover:border-slate-400 transition-colors"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => uploadFiles(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Loader2 size={28} className="animate-spin" />
              <span className="text-sm">Uploading…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Upload size={28} />
              <div className="text-sm font-medium text-slate-300">Drop photos here or click to browse</div>
              <div className="text-xs">JPG, PNG, WEBP · max 10 MB each</div>
            </div>
          )}
        </div>

        {form.photos.length > 0 && (
          <div>
            <div className="text-sm font-medium text-slate-300 mb-2">{form.photos.length} photo{form.photos.length !== 1 ? "s" : ""} uploaded</div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {form.photos.map((photo, i) => (
                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.filename} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-1">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); set({ photos: form.photos.filter((_, j) => j !== i) }); }}
                      className="bg-red-500 rounded-full p-0.5"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5 text-[10px] text-white truncate">
                    {photo.category}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-sm text-slate-400">
          💡 No photos yet? No problem — skip this step. We can pull photos from your Google Business profile or Checkatrade page.
        </div>
      </div>
    </div>
  );
}

function StepSuccess({ businessName }: { businessName: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={32} className="text-green-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Brief received!</h2>
      <p className="text-slate-400 max-w-sm mx-auto">
        We&apos;ve got everything we need for <span className="text-white font-medium">{businessName}</span>.
        We&apos;ll have a preview of your website ready within 24 hours.
      </p>
      <div className="mt-8 p-5 bg-slate-800 rounded-2xl border border-slate-700 text-left max-w-sm mx-auto">
        <div className="text-sm font-semibold text-white mb-3">What happens next</div>
        <div className="space-y-3">
          {[
            "We generate your website from your brief",
            "You get a preview link to review",
            "We make any tweaks you want",
            "We go live on your domain within 24 hours",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

const STEPS = ["trade", "business", "services", "trust", "photos"] as const;
type Step = typeof STEPS[number];

export default function UniversalBriefForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [step, setStep] = useState<Step>("trade");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (patch: Partial<FormState>) => setForm(f => ({ ...f, ...patch }));

  const stepIndex = STEPS.indexOf(step) + 1;
  const totalSteps = STEPS.length;

  function canAdvance(): boolean {
    if (step === "trade") return Boolean(form.tradeGroup);
    if (step === "business") return Boolean(form.businessName && form.phone && form.email && form.city);
    if (step === "services") return form.services.length > 0 && form.description.length >= DESC_MIN;
    return true;
  }

  function next() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }

  function back() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/universal-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const isLastStep = step === STEPS[STEPS.length - 1];

  if (done) return <StepSuccess businessName={form.businessName} />;

  return (
    <div className="w-full max-w-xl mx-auto">
      <ProgressBar step={stepIndex} total={totalSteps} />

      <div className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === "trade"    && <StepTrade form={form} set={set} />}
            {step === "business" && <StepBusiness form={form} set={set} />}
            {step === "services" && <StepTradeQuestions form={form} set={set} />}
            {step === "trust"    && <StepTrust form={form} set={set} />}
            {step === "photos"   && <StepPhotos form={form} set={set} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 mt-8">
        {step !== "trade" && (
          <button
            type="button"
            onClick={back}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:border-slate-400 transition-colors text-sm"
          >
            <ChevronLeft size={16} /> Back
          </button>
        )}

        {isLastStep ? (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold transition-colors"
          >
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Sending brief…</> : "Submit website brief"}
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            disabled={!canAdvance()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            Continue <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
