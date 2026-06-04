"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckCircle, ImagePlus, Loader2, X } from "lucide-react";

type RecordData = {
  business_name: string;
  business_email: string;
  preview_url: string;
  industry: string;
  location: string;
};

type FormState = {
  name:              string;
  phone:             string;
  email:             string;
  businessName:      string;
  preferredDomain:   string;
  servicesWanted:    string;
  designChanges:     string;
  photoUrls:         string[];
  preferredCallTime: string;
  notes:             string;
};

const CALL_TIMES = ["Morning (9am – 12pm)", "Afternoon (12pm – 5pm)", "Evening (5pm – 7pm)", "Any time"];

const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors bg-white";

export default function InterestFormClient({ token }: { token: string }) {
  const [pageStatus, setPageStatus] = useState<"loading" | "ready" | "not_found" | "opted_out" | "already_submitted">("loading");
  const [record, setRecord]         = useState<RecordData | null>(null);
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError]         = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    name:              "",
    phone:             "",
    email:             "",
    businessName:      "",
    preferredDomain:   "",
    servicesWanted:    "",
    designChanges:     "",
    photoUrls:         [],
    preferredCallTime: "",
    notes:             "",
  });

  useEffect(() => {
    fetch(`/api/interest-forms/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error === "opted_out")         { setPageStatus("opted_out"); return; }
        if (data.error === "already_submitted") { setPageStatus("already_submitted"); return; }
        if (data.error)                         { setPageStatus("not_found"); return; }
        setRecord(data.record as RecordData);
        setForm((f) => ({
          ...f,
          email:        data.record.business_email ?? "",
          businessName: data.record.business_name  ?? "",
        }));
        setPageStatus("ready");
      })
      .catch(() => setPageStatus("not_found"));
  }, [token]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";
    setPhotoUploading(true);
    setPhotoError("");
    try {
      const uploaded = await Promise.all(files.map(async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        // Reuse the brief-form upload endpoint with a public token approach —
        // for interest form we send to a dedicated endpoint
        const res = await fetch(`/api/interest-forms/${token}/upload`, { method: "POST", body: fd });
        if (!res.ok) throw new Error((await res.json() as { error?: string }).error ?? "Upload failed");
        return (await res.json() as { url: string }).url;
      }));
      setForm((f) => ({ ...f, photoUrls: [...f.photoUrls, ...uploaded] }));
    } catch (err) {
      setPhotoError((err as Error).message);
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim())  { setError("Please enter your name."); return; }
    if (!form.email.trim()) { setError("Please enter your email address."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/interest-forms/${token}/submit`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      if (res.status === 409) { setPageStatus("already_submitted"); return; }
      if (!res.ok) throw new Error((await res.json() as { error?: string }).error ?? "Error");
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError((err as Error).message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── States ───────────────────────────────────────────────────────────────

  if (pageStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (pageStatus === "not_found") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Link not found</h1>
          <p className="text-slate-500 text-sm">This link is invalid or has expired. Please contact us directly at ridentechnologies.com</p>
        </div>
      </div>
    );
  }

  if (pageStatus === "opted_out") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <CheckCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-900 mb-2">You&apos;ve unsubscribed</h1>
          <p className="text-slate-500 text-sm">You&apos;ve already opted out of our outreach. We won&apos;t contact you again.</p>
        </div>
      </div>
    );
  }

  if (pageStatus === "already_submitted") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Already received</h1>
          <p className="text-slate-500 text-sm">We&apos;ve already got your details — our team will be in touch very soon.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">Brilliant — we&apos;ll be in touch!</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Thanks for getting back to us. Ridley will be in contact within 1 business day to discuss your website and answer any questions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Glad you&apos;re interested{record?.business_name ? ` — let&apos;s get ${record.business_name} online` : ""}
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Fill in a few details below so we can get everything ready for you. Takes about 2 minutes.
          </p>
        </div>

        {/* Preview link */}
        {record?.preview_url && (
          <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-700">Your website preview:</p>
            <a
              href={record.preview_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:underline flex-shrink-0"
            >
              View site →
            </a>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Contact details */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Your contact details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Your name <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Dave Smith" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone number</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="07700 900000" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="hello@yourbusiness.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Business name</label>
                <input value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Domain + Services */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Website details</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Preferred domain name <span className="text-slate-400 font-normal">(optional)</span></label>
              <input value={form.preferredDomain} onChange={(e) => setForm((f) => ({ ...f, preferredDomain: e.target.value }))} placeholder="e.g. davesplumbing.co.uk" className={inputCls} />
              <p className="mt-1.5 text-xs text-slate-400">Don&apos;t worry if you&apos;re not sure — we can sort this together.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Services you&apos;d like listed <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea rows={3} value={form.servicesWanted} onChange={(e) => setForm((f) => ({ ...f, servicesWanted: e.target.value }))} placeholder="e.g. Boiler installations, central heating, emergency call-outs..." className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Any design preferences or changes? <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea rows={3} value={form.designChanges} onChange={(e) => setForm((f) => ({ ...f, designChanges: e.target.value }))} placeholder="e.g. I&apos;d prefer a darker colour scheme, can we change the logo font..." className={`${inputCls} resize-none`} />
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Photos <span className="text-slate-400 font-normal text-xs">(optional)</span></h2>
              <p className="text-xs text-slate-400 mt-0.5">Got photos of your work? Upload them here and we&apos;ll add them to your site.</p>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} />
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {form.photoUrls.map((url) => (
                <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setForm((f) => ({ ...f, photoUrls: f.photoUrls.filter((u) => u !== url) }))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={10} />
                  </button>
                </div>
              ))}
              {form.photoUrls.length < 20 && (
                <button type="button" onClick={() => photoInputRef.current?.click()} disabled={photoUploading}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-50">
                  {photoUploading ? <Loader2 size={18} className="text-blue-500 animate-spin" /> : <><ImagePlus size={18} className="text-slate-400" /><span className="text-[10px] text-slate-400">Add</span></>}
                </button>
              )}
            </div>
            {photoError && <p className="text-xs text-red-600">{photoError}</p>}
          </div>

          {/* Call time + notes */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Call preferences</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Best time for a quick call?</label>
              <div className="flex flex-wrap gap-2">
                {CALL_TIMES.map((t) => (
                  <button key={t} type="button"
                    onClick={() => setForm((f) => ({ ...f, preferredCallTime: f.preferredCallTime === t ? "" : t }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${form.preferredCallTime === t ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 text-slate-600 hover:border-blue-400"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Anything else? <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any questions, special requests, or anything else you&apos;d like us to know..." className={`${inputCls} resize-none`} />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-violet-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : "Yes, I&apos;m interested — let&apos;s go →"}
          </button>

          <p className="text-center text-xs text-slate-400 pb-8">
            No commitment required. We&apos;ll be in touch within 1 business day.
          </p>
        </form>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-10 shadow-sm">
      <div className="max-w-xl mx-auto flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
          <span className="text-white text-sm font-bold">R</span>
        </div>
        <div>
          <span className="font-semibold text-slate-900 text-sm">Riden Technologies</span>
          <p className="text-[11px] text-slate-400 leading-none mt-0.5">Website Interest Form</p>
        </div>
      </div>
    </header>
  );
}
