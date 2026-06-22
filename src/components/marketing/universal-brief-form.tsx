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
  /** Maps sub-trade name to the subset of services to show. Missing key = show all. */
  subTradeServices?: Record<string, string[]>;
  accreditations: string[];
  /** Maps sub-trade name to the subset of accreditations to show. Missing key = show all. */
  subTradeAccreditations?: Record<string, string[]>;
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
    accreditations: [
      "Gas Safe registered",
      "OFTEC registered",
      "CIPHE member",
      "APHC member",
      "WaterSafe approved",
      "NADC member",
      "Worcester Bosch Accredited",
      "Vaillant Advanced Installer",
      "Ideal Installer Plus",
      "MLA approved",
      "SSAIB registered",
      "DBS checked",
      "TrustMark registered",
      "Checkatrade member",
    ],
    subTradeAccreditations: {
      "Gas engineer":      ["Gas Safe registered", "OFTEC registered", "CIPHE member", "TrustMark registered", "Checkatrade member"],
      "Emergency plumber": ["APHC member", "WaterSafe approved", "TrustMark registered", "Checkatrade member"],
      "Drain specialist":  ["NADC member", "TrustMark registered", "Checkatrade member"],
      "Heating engineer":  ["Gas Safe registered", "OFTEC registered", "CIPHE member", "TrustMark registered", "Checkatrade member"],
      "Boiler specialist": ["Gas Safe registered", "OFTEC registered", "Worcester Bosch Accredited", "Vaillant Advanced Installer", "Ideal Installer Plus", "Checkatrade member"],
      "Locksmith":         ["MLA approved", "SSAIB registered", "DBS checked", "Checkatrade member"],
    },
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
    accreditations: [
      "Gas Safe registered",
      "APHC member",
      "WaterSafe approved",
      "CIPHE member",
      "NICEIC approved",
      "NAPIT registered",
      "Part P certified",
      "ELECSA registered",
      "ECA member",
      "FMB member",
      "NHBC registered",
      "LABC registered",
      "NFRC member",
      "CompetentRoofer registered",
      "KBSA member",
      "NADC member",
      "TrustMark registered",
      "Checkatrade member",
    ],
    subTradeAccreditations: {
      "Plumber":                    ["APHC member", "WaterSafe approved", "CIPHE member", "Gas Safe registered", "TrustMark registered", "Checkatrade member"],
      "Electrician":                ["NICEIC approved", "NAPIT registered", "Part P certified", "ELECSA registered", "ECA member", "Checkatrade member"],
      "Builder":                    ["FMB member", "NHBC registered", "LABC registered", "TrustMark registered", "Checkatrade member"],
      "General contractor":         [],
      "Roofer":                     ["NFRC member", "CompetentRoofer registered", "TrustMark registered", "Checkatrade member"],
      "Kitchen fitter":             ["KBSA member", "TrustMark registered", "Checkatrade member"],
      "Bathroom fitter":            ["KBSA member", "CIPHE member", "TrustMark registered", "Checkatrade member"],
      "Loft conversion specialist": ["FMB member", "NHBC registered", "TrustMark registered", "Checkatrade member"],
      "Drain specialist":           ["NADC member", "WaterSafe approved", "Checkatrade member"],
    },
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
    accreditations: [
      "APL member",
      "BALI member",
      "Marshalls approved",
      "ICB certified",
      "RHS qualified",
      "NPTC certified",
      "Arborist certified (AA)",
      "ISA member",
      "TrustMark registered",
      "Checkatrade member",
    ],
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
    accreditations: [
      "Dulux Select Decorator",
      "Painting and Decorating Association member",
      "FPDC member",
      "CTD accredited tiler",
      "TrustMark registered",
      "Checkatrade member",
    ],
    photoCategories: ["Before & after", "Interior work", "Exterior work", "Commercial projects", "Plastering & rendering"],
    templateId: "finish-decor",
  },
];

// ─── Types ───────────────────────────────────────────────────────────────────

type PhotoSlot = { url: string; filename: string };

type BeforeAfterPair = {
  id: string;
  category: string;
  before: PhotoSlot;
  after: PhotoSlot;
};

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
  pairs: BeforeAfterPair[];
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
  pairs: [],
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
            <option value="">Select your specific trade</option>
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
          <input className={inputCls} type="url" placeholder="https://yoursite.com" value={form.existingWebsite} onChange={e => set({ existingWebsite: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}

const DESC_MIN = 200;

function AccreditationsField({ form, set, trade }: { form: FormState; set: (f: Partial<FormState>) => void; trade: TradeConfig }) {
  const [customInput, setCustomInput] = useState("");

  const subMap = trade.subTradeAccreditations?.[form.subTrade];
  const visibleAccreditations = subMap && subMap.length > 0 ? subMap : trade.accreditations;
  const customAccreditations = form.accreditations.filter(a => !trade.accreditations.includes(a));

  function addCustom() {
    const trimmed = customInput.trim();
    if (!trimmed || form.accreditations.includes(trimmed)) return;
    set({ accreditations: [...form.accreditations, trimmed] });
    setCustomInput("");
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-3">Accreditations and memberships</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {visibleAccreditations.map(a => (
          <CheckPill
            key={a}
            label={a}
            checked={form.accreditations.includes(a)}
            onClick={() => set({ accreditations: toggle(form.accreditations, a) })}
          />
        ))}
      </div>

      {customAccreditations.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-700">
          {customAccreditations.map(a => (
            <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-sm">
              {a}
              <button
                type="button"
                onClick={() => set({ accreditations: form.accreditations.filter(x => x !== a) })}
                className="text-blue-400 hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <input
          className={`${inputCls} flex-1`}
          placeholder="Add an accreditation not listed above"
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customInput.trim()}
          className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex-shrink-0"
        >
          Add
        </button>
      </div>
    </div>
  );
}

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
      <p className="text-slate-400 mb-6">Tick everything you offer. This builds your services page automatically.</p>
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
              placeholder="Add a service not listed above"
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

        <AccreditationsField form={form} set={set} trade={trade} />

        <Field label="Tell us a bit about your business">
          <textarea
            className={`${inputCls} h-28 resize-none ${!descOk && descLen > 0 ? "border-amber-500/60" : ""}`}
            placeholder="How long have you been trading? What makes you different? Any specialisms? What area do you cover? Tell us anything that helps us write your website copy."
            value={form.description}
            onChange={e => set({ description: e.target.value })}
          />
          <div className={`flex justify-between text-xs mt-1 ${descOk ? "text-green-400" : descLen > 0 ? "text-amber-400" : "text-slate-500"}`}>
            <span>{descOk ? "Great, that’s enough detail" : `Minimum ${DESC_MIN} characters to help us write your copy`}</span>
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
            <option value="">Select</option>
            {["Less than 1 year","1-2 years","3-5 years","6-10 years","10-20 years","20+ years"].map(v => <option key={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="Checkatrade profile URL (if you have one)">
          <input
            className={inputCls}
            type="url"
            placeholder="https://www.checkatrade.com/trades/"
            value={form.checkatradeProfile}
            onChange={e => set({ checkatradeProfile: e.target.value })}
          />
        </Field>

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-sm text-slate-400">
          Don&apos;t worry if you don&apos;t have these yet. We can always add them later once your website is live.
        </div>
      </div>
    </div>
  );
}

async function uploadPhoto(file: File): Promise<PhotoSlot | null> {
  if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) return null;
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/universal-brief/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    const data = await res.json() as { url: string };
    return { url: data.url, filename: file.name };
  } catch { return null; }
}

function UploadSlot({
  label, photo, uploading, onFile, onClear,
}: {
  label: string;
  photo: PhotoSlot | null;
  uploading: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{label}</div>
      {photo ? (
        <div className="relative rounded-xl overflow-hidden bg-slate-800 aspect-[4/3]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={label} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 rounded-full p-1 transition-colors"
          >
            <X size={12} className="text-white" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => ref.current?.click()}
          className="rounded-xl border-2 border-dashed border-slate-600 hover:border-slate-400 transition-colors cursor-pointer aspect-[4/3] flex flex-col items-center justify-center gap-2 bg-slate-800/40"
        >
          <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]); e.target.value = ""; }} />
          {uploading ? (
            <Loader2 size={22} className="animate-spin text-slate-400" />
          ) : (
            <>
              <Upload size={22} className="text-slate-500" />
              <span className="text-xs text-slate-500">Tap to add {label.toLowerCase()} photo</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StepPhotos({ form, set }: { form: FormState; set: (f: Partial<FormState>) => void }) {
  const trade = currentTrade(form)!;

  // Categories driven by selected services; fall back to trade defaults
  const categories = form.services.length > 0 ? form.services : trade.photoCategories;

  const [category, setCategory] = useState(categories[0] ?? "");
  const [before, setBefore] = useState<PhotoSlot | null>(null);
  const [after, setAfter] = useState<PhotoSlot | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<"before" | "after" | null>(null);

  async function handleFile(file: File, slot: "before" | "after") {
    setUploadingSlot(slot);
    const result = await uploadPhoto(file);
    if (result) { slot === "before" ? setBefore(result) : setAfter(result); }
    setUploadingSlot(null);
  }

  function addPair() {
    if (!before || !after) return;
    const pair: BeforeAfterPair = {
      id: crypto.randomUUID(),
      category,
      before,
      after,
    };
    set({ pairs: [...form.pairs, pair] });
    setBefore(null);
    setAfter(null);
  }

  function removePair(id: string) {
    set({ pairs: form.pairs.filter(p => p.id !== id) });
  }

  const canAdd = Boolean(before && after);

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Before & after photos</h2>
      <p className="text-slate-400 mb-6">Upload a before and after photo for each job. Both are required to add a card.</p>

      <div className="space-y-5">
        {/* Category — from selected services */}
        <Field label="Job type">
          <select
            className={inputCls}
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>

        {/* Before / After upload slots */}
        <div className="grid grid-cols-2 gap-3">
          <UploadSlot
            label="Before"
            photo={before}
            uploading={uploadingSlot === "before"}
            onFile={f => handleFile(f, "before")}
            onClear={() => setBefore(null)}
          />
          <UploadSlot
            label="After"
            photo={after}
            uploading={uploadingSlot === "after"}
            onFile={f => handleFile(f, "after")}
            onClear={() => setAfter(null)}
          />
        </div>

        <button
          type="button"
          onClick={addPair}
          disabled={!canAdd}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-blue-500/40 text-blue-400 text-sm font-medium hover:border-blue-500 hover:bg-blue-500/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <CheckCircle2 size={16} />
          Add before &amp; after card
        </button>

        {/* Added pairs */}
        {form.pairs.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-slate-300">{form.pairs.length} card{form.pairs.length !== 1 ? "s" : ""} added</div>
            {form.pairs.map(pair => (
              <div key={pair.id} className="rounded-xl border border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-800">
                  <span className="text-xs font-medium text-slate-300 truncate">{pair.category}</span>
                  <button type="button" onClick={() => removePair(pair.id)} className="text-slate-500 hover:text-red-400 transition-colors ml-2 flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pair.before.url} alt="Before" className="w-full aspect-[4/3] object-cover" />
                    <div className="absolute bottom-1.5 left-1.5 text-[10px] bg-black/70 px-1.5 py-0.5 rounded text-white font-medium">Before</div>
                  </div>
                  <div className="relative border-l border-slate-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pair.after.url} alt="After" className="w-full aspect-[4/3] object-cover" />
                    <div className="absolute bottom-1.5 left-1.5 text-[10px] bg-black/70 px-1.5 py-0.5 rounded text-white font-medium">After</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-sm text-slate-400">
          No photos yet? No problem. Skip this step and we can pull photos from your Google Business profile or Checkatrade page.
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
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Sending brief</> : "Submit website brief"}
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
