"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckCircle, ImagePlus, Loader2, X, ChevronRight, ChevronLeft } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type RecordData = {
  business_name:   string;
  business_email:  string;
  business_phone:  string | null;
  industry:        string | null;
  location:        string | null;
};

type PageStatus = "loading" | "ready" | "not_found" | "opted_out" | "already_submitted";

type FormState = {
  // Business Information
  businessName:  string;
  contactName:   string;
  email:         string;
  phone:         string;
  serviceArea:   string;
  // Website Information
  servicesOffered:  string;
  aboutBusiness:    string;
  preferredDomain:  string;
  existingDomain:   string;
  // Branding
  logoUrl:         string;
  brandColours:    string;
  socialFacebook:  string;
  socialInstagram: string;
  socialTikTok:    string;
  socialLinkedIn:  string;
  // Content
  photoUrls:    string[];
  galleryUrls:  string[];
  testimonials: string;
  reviews:      string;
  // Preferences
  designStyle:         string;
  competitorWebsites:  string;
  additionalNotes:     string;
};

const DESIGN_STYLES = [
  "Modern & Clean",
  "Bold & Eye-catching",
  "Professional & Corporate",
  "Friendly & Approachable",
  "Minimal & Simple",
];

const SECTIONS = [
  "Business Info",
  "Your Website",
  "Branding",
  "Photos & Content",
  "Preferences",
];

// ── Shared input styles ───────────────────────────────────────────────────────

const inputCls =
  "w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition-colors bg-white";
const labelCls = "block text-sm font-medium text-slate-700 mb-1.5";
const fieldCls = "mb-5";

// ── Main component ────────────────────────────────────────────────────────────

export default function BriefFormClient({ token }: { token: string }) {
  const [pageStatus,  setPageStatus]  = useState<PageStatus>("loading");
  const [record,      setRecord]      = useState<RecordData | null>(null);
  const [section,     setSection]     = useState(0);
  const [submitted,   setSubmitted]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");

  const [logoUploading,  setLogoUploading]  = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [logoError,      setLogoError]      = useState("");
  const [photoError,     setPhotoError]     = useState("");
  const logoInputRef  = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;
  const photoInputRef = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;

  const [form, setForm] = useState<FormState>({
    businessName: "", contactName: "", email: "", phone: "", serviceArea: "",
    servicesOffered: "", aboutBusiness: "", preferredDomain: "", existingDomain: "",
    logoUrl: "", brandColours: "", socialFacebook: "", socialInstagram: "", socialTikTok: "", socialLinkedIn: "",
    photoUrls: [], galleryUrls: [], testimonials: "", reviews: "",
    designStyle: "", competitorWebsites: "", additionalNotes: "",
  });

  // Load record and pre-fill
  useEffect(() => {
    fetch(`/api/client-brief-forms/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error === "opted_out")         { setPageStatus("opted_out"); return; }
        if (data.error === "already_submitted") { setPageStatus("already_submitted"); return; }
        if (data.error)                         { setPageStatus("not_found"); return; }
        const rec = data.record as RecordData;
        setRecord(rec);
        setForm((f) => ({
          ...f,
          businessName: rec.business_name  ?? "",
          email:        rec.business_email ?? "",
          phone:        rec.business_phone ?? "",
          serviceArea:  rec.location       ?? "",
        }));
        setPageStatus("ready");
        // Track form started
        fetch(`/api/client-brief-forms/${token}/started`, { method: "POST" }).catch(() => {});
      })
      .catch(() => setPageStatus("not_found"));
  }, [token]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // ── Logo upload ─────────────────────────────────────────────────────────────

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setLogoUploading(true); setLogoError("");
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch(`/api/client-brief-forms/${token}/upload`, { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (data.error) { setLogoError(data.error); return; }
      if (data.url) set("logoUrl", data.url);
    } catch { setLogoError("Upload failed. Please try again."); }
    finally { setLogoUploading(false); }
  }

  // ── Photo upload ─────────────────────────────────────────────────────────────

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";
    setPhotoUploading(true); setPhotoError("");
    try {
      const urls = await Promise.all(files.map(async (file) => {
        const fd = new FormData(); fd.append("file", file);
        const res = await fetch(`/api/client-brief-forms/${token}/upload`, { method: "POST", body: fd });
        const data = await res.json() as { url?: string; error?: string };
        if (data.error) throw new Error(data.error);
        return data.url!;
      }));
      set("photoUrls", [...form.photoUrls, ...urls]);
    } catch (err) { setPhotoError(err instanceof Error ? err.message : "Upload failed."); }
    finally { setPhotoUploading(false); }
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setSubmitting(true); setError("");
    try {
      const res  = await fetch(`/api/client-brief-forms/${token}/submit`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch { setError("Network error. Please try again."); }
    finally { setSubmitting(false); }
  }

  // ── Status screens ────────────────────────────────────────────────────────────

  if (pageStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-cyan-500" size={32} />
      </div>
    );
  }

  if (pageStatus === "opted_out") {
    return <StatusScreen title="You&apos;ve opted out" body="You won't receive any further emails from us. No hard feelings at all!" />;
  }

  if (pageStatus === "already_submitted" || submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="text-emerald-500" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            {submitted ? "Brief submitted!" : "Already submitted"}
          </h1>
          <p className="text-slate-600 leading-relaxed mb-4">
            {submitted
              ? `Thank you! We've received the brief for ${record?.business_name ?? "your business"} and we'll get straight to work on your free demo. We'll be in touch within 1–2 working days to show you exactly what it could look like.`
              : "We've already received your brief — we'll be in touch with your demo soon!"}
          </p>
          <p className="text-sm text-slate-500">
            Questions? Reply to the email we sent you, or contact us at{" "}
            <a href="https://ridentechnologies.com" className="text-cyan-600 hover:underline">ridentechnologies.com</a>.
          </p>
        </div>
      </div>
    );
  }

  if (pageStatus === "not_found") {
    return <StatusScreen title="Link not found" body="This link may have expired or been used already. Please contact us if you need help." />;
  }

  // ── Form ──────────────────────────────────────────────────────────────────────

  const isFirst = section === 0;
  const isLast  = section === SECTIONS.length - 1;

  function canAdvance(): boolean {
    if (section === 0) return !!(form.businessName.trim() && form.contactName.trim() && form.email.trim());
    return true;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://ridentechnologies.com/images/RidenLogo-email.png" alt="Riden Technologies" className="h-8 w-auto" />
          <div className="ml-auto text-right">
            <p className="text-xs font-semibold text-slate-700">Free Website Brief</p>
            <p className="text-xs text-slate-400">{record?.business_name}</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex">
            {SECTIONS.map((s, i) => (
              <button
                key={s}
                onClick={() => i < section ? setSection(i) : undefined}
                className={`flex-1 py-3 text-center text-xs font-medium transition-colors border-b-2 ${
                  i === section
                    ? "border-cyan-500 text-cyan-600"
                    : i < section
                    ? "border-emerald-400 text-emerald-600 cursor-pointer"
                    : "border-transparent text-slate-400"
                }`}
              >
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold mr-1.5 ${
                  i < section ? "bg-emerald-100 text-emerald-600" : i === section ? "bg-cyan-100 text-cyan-600" : "bg-slate-100 text-slate-400"
                }`}>{i < section ? "✓" : i + 1}</span>
                <span className="hidden sm:inline">{s}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Section header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5">
            <p className="text-xs font-bold text-cyan-400 tracking-widest uppercase mb-1">
              Step {section + 1} of {SECTIONS.length}
            </p>
            <h2 className="text-xl font-bold text-white">{SECTIONS[section]}</h2>
          </div>

          {/* Section content */}
          <div className="px-6 py-6">
            {section === 0 && <SectionBusiness form={form} set={set} />}
            {section === 1 && <SectionWebsite  form={form} set={set} />}
            {section === 2 && (
              <SectionBranding
                form={form} set={set}
                logoUploading={logoUploading} logoError={logoError}
                logoInputRef={logoInputRef} onLogoClick={() => logoInputRef.current?.click()}
                onLogoChange={handleLogoChange}
              />
            )}
            {section === 3 && (
              <SectionContent
                form={form} set={set}
                photoUploading={photoUploading} photoError={photoError}
                photoInputRef={photoInputRef} onPhotoClick={() => photoInputRef.current?.click()}
                onPhotoChange={handlePhotoChange}
              />
            )}
            {section === 4 && <SectionPreferences form={form} set={set} />}
          </div>

          {/* Navigation */}
          <div className="px-6 pb-6 flex items-center justify-between gap-3">
            {!isFirst ? (
              <button
                onClick={() => setSection((s) => s - 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft size={16} /> Back
              </button>
            ) : <div />}

            {!isLast ? (
              <button
                onClick={() => { if (canAdvance()) setSection((s) => s + 1); }}
                disabled={!canAdvance()}
                className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-semibold text-white bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-8 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-60 rounded-lg transition-all shadow-md"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {submitting ? "Submitting…" : "Submit Brief"}
              </button>
            )}
          </div>

          {error && (
            <div className="mx-6 mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Your information is private and will only be used to create your website concept.
          &nbsp;·&nbsp;
          <a href="https://ridentechnologies.com" className="hover:text-slate-600 underline">ridentechnologies.com</a>
        </p>
      </div>
    </div>
  );
}

// ── Section components ────────────────────────────────────────────────────────

function SectionBusiness({ form, set }: { form: FormState; set: (k: keyof FormState, v: string) => void }) {
  return (
    <>
      <p className="text-sm text-slate-500 mb-5">
        Let&rsquo;s start with the basics. We&rsquo;ve pre-filled what we know — just update anything that&rsquo;s wrong.
      </p>
      <div className={fieldCls}>
        <label className={labelCls}>Business Name <Required /></label>
        <input className={inputCls} value={form.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="e.g. Smith Plumbing Ltd" />
      </div>
      <div className={fieldCls}>
        <label className={labelCls}>Your Name <Required /></label>
        <input className={inputCls} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="e.g. John Smith" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className={labelCls}>Email Address <Required /></label>
          <input className={inputCls} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="john@example.com" />
        </div>
        <div>
          <label className={labelCls}>Phone Number</label>
          <input className={inputCls} type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07700 000000" />
        </div>
      </div>
      <div className={fieldCls}>
        <label className={labelCls}>Service Area</label>
        <input className={inputCls} value={form.serviceArea} onChange={(e) => set("serviceArea", e.target.value)} placeholder="e.g. Manchester and surrounding areas" />
        <p className="text-xs text-slate-400 mt-1">Where do you cover? Town, city, or county.</p>
      </div>
    </>
  );
}

function SectionWebsite({ form, set }: { form: FormState; set: (k: keyof FormState, v: string) => void }) {
  return (
    <>
      <p className="text-sm text-slate-500 mb-5">
        Tell us about what you offer. This helps us write the right content for your website.
      </p>
      <div className={fieldCls}>
        <label className={labelCls}>Services Offered</label>
        <textarea
          className={`${inputCls} resize-none`} rows={4}
          value={form.servicesOffered}
          onChange={(e) => set("servicesOffered", e.target.value)}
          placeholder={"e.g.\nBoiler installation & repair\nCentral heating\nEmergency call-outs\nGas safety certificates"}
        />
        <p className="text-xs text-slate-400 mt-1">List the main services you want featured. One per line works well.</p>
      </div>
      <div className={fieldCls}>
        <label className={labelCls}>About Your Business</label>
        <textarea
          className={`${inputCls} resize-none`} rows={4}
          value={form.aboutBusiness}
          onChange={(e) => set("aboutBusiness", e.target.value)}
          placeholder="e.g. Family-run plumbing business with 15 years experience. Based in Manchester, serving homeowners and landlords across Greater Manchester…"
        />
        <p className="text-xs text-slate-400 mt-1">A short description of your business and what makes you stand out.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Preferred Domain Name</label>
          <input className={inputCls} value={form.preferredDomain} onChange={(e) => set("preferredDomain", e.target.value)} placeholder="e.g. smithplumbing.co.uk" />
          <p className="text-xs text-slate-400 mt-1">Leave blank if you&rsquo;re unsure — we can suggest one.</p>
        </div>
        <div>
          <label className={labelCls}>Existing Website (if any)</label>
          <input className={inputCls} value={form.existingDomain} onChange={(e) => set("existingDomain", e.target.value)} placeholder="e.g. https://smithplumbing.co.uk" />
        </div>
      </div>
    </>
  );
}

type UploadProps = {
  form: FormState;
  set: (k: keyof FormState, v: string | string[]) => void;
  logoUploading: boolean; logoError: string;
  logoInputRef: React.RefObject<HTMLInputElement>;
  onLogoClick: () => void; onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function SectionBranding({ form, set, logoUploading, logoError, logoInputRef, onLogoClick, onLogoChange }: UploadProps) {
  return (
    <>
      <p className="text-sm text-slate-500 mb-5">
        Help us match your existing branding or tell us what you&rsquo;re looking for.
      </p>

      {/* Logo upload */}
      <div className={fieldCls}>
        <label className={labelCls}>Business Logo</label>
        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
        {form.logoUrl ? (
          <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.logoUrl} alt="Logo" className="h-12 w-auto object-contain rounded" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 font-medium">Logo uploaded</p>
              <p className="text-xs text-slate-400 truncate">{form.logoUrl}</p>
            </div>
            <button onClick={() => set("logoUrl", "")} className="p-1 text-slate-400 hover:text-red-500 transition-colors"><X size={14} /></button>
          </div>
        ) : (
          <button
            onClick={onLogoClick} disabled={logoUploading}
            className="w-full border-2 border-dashed border-slate-200 rounded-lg py-6 text-center hover:border-cyan-300 hover:bg-cyan-50/50 transition-colors"
          >
            {logoUploading
              ? <Loader2 size={20} className="animate-spin text-cyan-500 mx-auto" />
              : <><ImagePlus size={20} className="text-slate-400 mx-auto mb-2" /><p className="text-sm text-slate-500">Click to upload your logo</p><p className="text-xs text-slate-400 mt-0.5">JPG, PNG or WEBP · max 8 MB</p></>
            }
          </button>
        )}
        {logoError && <p className="text-xs text-red-500 mt-1">{logoError}</p>}
        <p className="text-xs text-slate-400 mt-1.5">No logo yet? No problem — we can create a clean text-based logo for you.</p>
      </div>

      <div className={fieldCls}>
        <label className={labelCls}>Brand Colours</label>
        <input className={inputCls} value={form.brandColours} onChange={(e) => set("brandColours", e.target.value)} placeholder="e.g. Navy blue and white, or #003366" />
        <p className="text-xs text-slate-400 mt-1">Describe your colours or leave blank and we&rsquo;ll choose something that suits your trade.</p>
      </div>

      <div className={fieldCls}>
        <label className={labelCls}>Social Media Links</label>
        <div className="space-y-2">
          {[
            { key: "socialFacebook",  placeholder: "Facebook page URL" },
            { key: "socialInstagram", placeholder: "Instagram profile URL" },
            { key: "socialTikTok",    placeholder: "TikTok profile URL" },
            { key: "socialLinkedIn",  placeholder: "LinkedIn page URL" },
          ].map(({ key, placeholder }) => (
            <input
              key={key} className={inputCls}
              value={form[key as keyof FormState] as string}
              onChange={(e) => set(key as keyof FormState, e.target.value)}
              placeholder={placeholder}
            />
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-1.5">Add any that apply — we&rsquo;ll link them in the footer.</p>
      </div>
    </>
  );
}

type ContentProps = {
  form: FormState;
  set: (k: keyof FormState, v: string | string[]) => void;
  photoUploading: boolean; photoError: string;
  photoInputRef: React.RefObject<HTMLInputElement>;
  onPhotoClick: () => void; onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function SectionContent({ form, set, photoUploading, photoError, photoInputRef, onPhotoClick, onPhotoChange }: ContentProps) {
  return (
    <>
      <p className="text-sm text-slate-500 mb-5">
        Photos of your work make a huge difference to a website. Upload as many as you have.
      </p>

      {/* Work photos */}
      <div className={fieldCls}>
        <label className={labelCls}>Work Photos / Gallery</label>
        <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onPhotoChange} />

        {form.photoUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {form.photoUrls.map((url, i) => (
              <div key={url} className="relative group rounded-lg overflow-hidden aspect-square bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => set("photoUrls", form.photoUrls.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onPhotoClick} disabled={photoUploading}
          className="w-full border-2 border-dashed border-slate-200 rounded-lg py-5 text-center hover:border-cyan-300 hover:bg-cyan-50/50 transition-colors"
        >
          {photoUploading
            ? <Loader2 size={20} className="animate-spin text-cyan-500 mx-auto" />
            : <><ImagePlus size={20} className="text-slate-400 mx-auto mb-2" />
               <p className="text-sm text-slate-500">Click to upload photos{form.photoUrls.length > 0 ? " (add more)" : ""}</p>
               <p className="text-xs text-slate-400 mt-0.5">Select multiple at once · JPG, PNG · max 8 MB each</p></>
          }
        </button>
        {photoError && <p className="text-xs text-red-500 mt-1">{photoError}</p>}
        <p className="text-xs text-slate-400 mt-1.5">
          No photos yet? Don&rsquo;t worry — you can send them later and we&rsquo;ll add them.
        </p>
      </div>

      <div className={fieldCls}>
        <label className={labelCls}>Customer Testimonials</label>
        <textarea
          className={`${inputCls} resize-none`} rows={3}
          value={form.testimonials}
          onChange={(e) => set("testimonials", e.target.value)}
          placeholder={"e.g.\n\"Excellent service, fixed our boiler same day.\" — Sarah T.\n\"Highly recommend, very professional.\" — Mark R."}
        />
        <p className="text-xs text-slate-400 mt-1">Paste in any quotes you&rsquo;d like featured. These build trust with potential customers.</p>
      </div>

      <div className={fieldCls}>
        <label className={labelCls}>Review Profiles</label>
        <textarea
          className={`${inputCls} resize-none`} rows={2}
          value={form.reviews}
          onChange={(e) => set("reviews", e.target.value)}
          placeholder={"e.g.\nGoogle: 4.9★ (87 reviews)\nCheckatrade: https://www.checkatrade.com/smithplumbing"}
        />
        <p className="text-xs text-slate-400 mt-1">Links to Google, Checkatrade, Trustpilot or your review score. We&rsquo;ll display it prominently.</p>
      </div>
    </>
  );
}

function SectionPreferences({ form, set }: { form: FormState; set: (k: keyof FormState, v: string) => void }) {
  return (
    <>
      <p className="text-sm text-slate-500 mb-5">
        Almost done! Just a few final preferences to help us nail the look and feel.
      </p>

      <div className={fieldCls}>
        <label className={labelCls}>Preferred Design Style</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DESIGN_STYLES.map((style) => (
            <button
              key={style}
              onClick={() => set("designStyle", style)}
              className={`px-4 py-3 text-sm font-medium rounded-lg border-2 text-left transition-all ${
                form.designStyle === style
                  ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      <div className={fieldCls}>
        <label className={labelCls}>Competitor or Inspiration Websites</label>
        <textarea
          className={`${inputCls} resize-none`} rows={3}
          value={form.competitorWebsites}
          onChange={(e) => set("competitorWebsites", e.target.value)}
          placeholder={"e.g.\nhttps://www.competitorplumbing.co.uk\nhttps://www.anothersite.co.uk — I like the layout\nhttps://www.inspiredby.com — I like the colours"}
        />
        <p className="text-xs text-slate-400 mt-1">Any sites you like the look of — competitors or just websites you admire.</p>
      </div>

      <div className={fieldCls}>
        <label className={labelCls}>Anything Else?</label>
        <textarea
          className={`${inputCls} resize-none`} rows={3}
          value={form.additionalNotes}
          onChange={(e) => set("additionalNotes", e.target.value)}
          placeholder="Any other requests, things to include, or things to avoid…"
        />
      </div>

      <div className="mt-2 p-4 bg-cyan-50 border border-cyan-100 rounded-xl">
        <p className="text-sm font-semibold text-cyan-800 mb-1">What happens next?</p>
        <p className="text-sm text-cyan-700 leading-relaxed">
          Once you click Submit, we&rsquo;ll get straight to work on a demo of exactly what your new website could look like.
          We&rsquo;ll be in touch within 1–2 working days — completely free to see, no obligation.
          If you love it and want to go live, it&rsquo;s &pound;299 setup then &pound;50/month. Simple as that.
        </p>
      </div>
    </>
  );
}

function Required() {
  return <span className="text-red-400 ml-0.5">*</span>;
}

function StatusScreen({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <p className="text-xl font-bold text-slate-800 mb-3" dangerouslySetInnerHTML={{ __html: title }} />
        <p className="text-slate-500 leading-relaxed">{body}</p>
        <p className="mt-4 text-sm text-slate-400">
          <a href="https://ridentechnologies.com" className="text-cyan-600 hover:underline">ridentechnologies.com</a>
        </p>
      </div>
    </div>
  );
}
