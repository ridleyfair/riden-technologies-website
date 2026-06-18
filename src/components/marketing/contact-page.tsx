"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  MapPin,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Globe,
  Palette,
  Building2,
  User,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const contactInfo = [
  { icon: Mail, label: "Email Us", value: "enquiries@ridentechnologies.com" },
  { icon: MapPin, label: "Location", value: "London, UK" },
];

const plans = [
  {
    id: "pro",
    name: "Pro plan: everything included",
    price: "£199 build + £29.99/mo",
    description:
      "Your website designed, built, hosted and maintained, with SEO, unlimited updates and UK support.",
    color: "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40",
    activeColor: "border-blue-500 bg-blue-50 ring-1 ring-blue-200",
    dot: "bg-blue-500",
  },
];

const styleOptions = [
  "Clean & minimal",
  "Bold & modern",
  "Professional & corporate",
  "Friendly & approachable",
  "Not sure yet",
];

const industryOptions = [
  "Trades & Construction",
  "Beauty & Wellness",
  "Health & Medical",
  "Food & Hospitality",
  "Retail & E-commerce",
  "Professional Services",
  "Property & Real Estate",
  "Fitness & Sport",
  "Education & Training",
  "Creative & Media",
  "Technology",
  "Other",
];

type FormData = {
  name: string;
  email: string;
  phone: string;
  city: string;
  company: string;
  industry: string;
  currentWebsite: string;
  servicesOffered: string;
  targetCustomers: string;
  plan: string;
  deadline: string;
  brandColours: string;
  designStyle: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  linkedin: string;
  references: string;
  notes: string;
};

const empty: FormData = {
  name: "",
  email: "",
  phone: "",
  city: "",
  company: "",
  industry: "",
  currentWebsite: "",
  servicesOffered: "",
  targetCustomers: "",
  plan: "",
  deadline: "",
  brandColours: "",
  designStyle: "",
  facebook: "",
  instagram: "",
  tiktok: "",
  linkedin: "",
  references: "",
  notes: "",
};

const steps = [
  { label: "Contact & Business", icon: Building2 },
  { label: "Website Details", icon: Globe },
  { label: "Design & Finish", icon: Palette },
];

function inputClass(extra = "") {
  return `w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition ${extra}`;
}

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-sm text-slate-600 mb-2">
      {children}
      {required && <span className="text-blue-600 ml-0.5">*</span>}
    </label>
  );
}

export default function ContactPage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormData>(empty);

  const set =
    (field: keyof FormData) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setPlan = (id: string) => setForm((prev) => ({ ...prev, plan: id }));

  const goNext = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };
  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const step1Valid =
    !!form.name && !!form.email && !!form.company && !!form.industry;
  const step2Valid =
    !!form.plan && !!form.servicesOffered && !!form.targetCustomers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      setError(
        "Something went wrong. Please email us at enquiries@ridentechnologies.com",
      );
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
  };

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-14 sm:py-20 overflow-hidden bg-gradient-to-b from-blue-50/60 to-white">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-100/40 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide ring-1 ring-blue-100"
          >
            Get Started
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-5 text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-4 sm:mb-5"
          >
            Let&apos;s Build Your{" "}
            <span className="gradient-text-brand">Website</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
          >
            Fill in the details below and we&apos;ll have everything we need to
            get started, no back-and-forth required.
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 sm:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Left sidebar */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                  Get in Touch
                </h2>
                <p className="text-slate-600 leading-relaxed text-sm">
                  The more detail you give us, the faster we can build. Once you
                  submit, we&apos;ll review your brief and reach out within 24
                  hours.
                </p>
              </motion.div>

              <div className="space-y-3">
                {contactInfo.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 bg-white ring-1 ring-slate-200 rounded-xl shadow-sm p-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center flex-shrink-0">
                      <item.icon size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">{item.label}</div>
                      <div className="text-sm font-medium text-slate-900">
                        {item.value}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white ring-1 ring-slate-200 rounded-xl shadow-sm p-6"
              >
                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                  What happens next?
                </h3>
                <ul className="space-y-3">
                  {[
                    "We review your brief within 24 hours",
                    "We match a template to your business",
                    "You get a preview before anything goes live",
                    "Launch in 2–5 business days",
                  ].map((s, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-slate-600"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-50 ring-1 ring-blue-100 text-xs font-semibold text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-3"
            >
              {submitted ? (
                <div className="bg-white ring-1 ring-slate-200 rounded-2xl shadow-sm p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center mb-6">
                    <CheckCircle size={32} className="text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    Brief Received!
                  </h3>
                  <p className="text-slate-600 max-w-sm">
                    Thanks! We&apos;ve got everything we need. Expect to hear
                    from us within 24 hours with your next steps.
                  </p>
                </div>
              ) : (
                <div className="bg-white ring-1 ring-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  {/* Step progress */}
                  <div className="border-b border-slate-200 px-5 sm:px-8 py-4">
                    <div className="flex items-center gap-2">
                      {steps.map((s, i) => (
                        <React.Fragment key={i}>
                          <div
                            className={`flex items-center gap-2 ${i <= step ? "opacity-100" : "opacity-50"}`}
                          >
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                i < step
                                  ? "bg-blue-600 text-white"
                                  : i === step
                                    ? "bg-blue-50 ring-1 ring-blue-200 text-blue-600"
                                    : "bg-slate-100 ring-1 ring-slate-200 text-slate-400"
                              }`}
                            >
                              {i < step ? "✓" : i + 1}
                            </div>
                            <span
                              className={`text-xs font-medium hidden sm:block ${i === step ? "text-slate-900" : "text-slate-500"}`}
                            >
                              {s.label}
                            </span>
                          </div>
                          {i < steps.length - 1 && (
                            <div
                              className={`flex-1 h-px transition-colors ${i < step ? "bg-blue-300" : "bg-slate-200"}`}
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="p-5 sm:p-8">
                      <AnimatePresence mode="wait" custom={direction}>
                        {step === 0 && (
                          <motion.div
                            key="step0"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.25 }}
                            className="space-y-5"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-5">
                                <User size={16} className="text-blue-600" />
                                <span className="text-sm font-semibold text-slate-900">
                                  Contact Details
                                </span>
                              </div>
                              <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                  <Label required>Full Name</Label>
                                  <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={set("name")}
                                    placeholder="John Smith"
                                    className={inputClass()}
                                  />
                                </div>
                                <div>
                                  <Label required>Email Address</Label>
                                  <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={set("email")}
                                    placeholder="john@company.com"
                                    className={inputClass()}
                                  />
                                </div>
                                <div>
                                  <Label>Phone Number</Label>
                                  <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={set("phone")}
                                    placeholder="+44 7700 000000"
                                    className={inputClass()}
                                  />
                                </div>
                                <div>
                                  <Label>Town / City</Label>
                                  <input
                                    type="text"
                                    value={form.city}
                                    onChange={set("city")}
                                    placeholder="London"
                                    className={inputClass()}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-slate-200 pt-5">
                              <div className="flex items-center gap-2 mb-5">
                                <Building2
                                  size={16}
                                  className="text-violet-600"
                                />
                                <span className="text-sm font-semibold text-slate-900">
                                  Your Business
                                </span>
                              </div>
                              <div className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                  <div>
                                    <Label required>Business Name</Label>
                                    <input
                                      type="text"
                                      required
                                      value={form.company}
                                      onChange={set("company")}
                                      placeholder="Acme Plumbing Ltd"
                                      className={inputClass()}
                                    />
                                  </div>
                                  <div>
                                    <Label required>Industry / Type</Label>
                                    <select
                                      required
                                      value={form.industry}
                                      onChange={set("industry")}
                                      className={inputClass()}
                                    >
                                      <option value="" className="bg-white">
                                        Select industry...
                                      </option>
                                      {industryOptions.map((opt) => (
                                        <option
                                          key={opt}
                                          value={opt}
                                          className="bg-white"
                                        >
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <Label>Current Website (if any)</Label>
                                  <div className="relative">
                                    <Globe
                                      size={14}
                                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                      type="url"
                                      value={form.currentWebsite}
                                      onChange={set("currentWebsite")}
                                      placeholder="https://yoursite.com"
                                      className={inputClass("pl-9")}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {step === 1 && (
                          <motion.div
                            key="step1"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.25 }}
                            className="space-y-6"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-900 mb-1">
                                Our plan
                                <span className="text-blue-600 ml-0.5">*</span>
                              </p>
                              <p className="text-xs text-slate-500 mb-4">
                                One simple plan covers everything. Select it to
                                continue. We can talk through the details on the call.
                              </p>
                              <div className="grid gap-3">
                                {plans.map((p) => (
                                  <button
                                    type="button"
                                    key={p.id}
                                    onClick={() => setPlan(p.id)}
                                    className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${form.plan === p.id ? p.activeColor : p.color}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={`w-2 h-2 rounded-full ${p.dot} ${form.plan === p.id ? "opacity-100" : "opacity-40"}`}
                                        />
                                        <span className="text-sm font-semibold text-slate-900">
                                          {p.name}
                                        </span>
                                      </div>
                                      <span className="text-xs font-medium text-slate-500">
                                        {p.price}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1 ml-5">
                                      {p.description}
                                    </p>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-slate-200 pt-5 space-y-4">
                              <div>
                                <Label required>
                                  What services or products do you offer?
                                </Label>
                                <textarea
                                  required
                                  rows={3}
                                  value={form.servicesOffered}
                                  onChange={set("servicesOffered")}
                                  placeholder="e.g. Emergency plumbing, boiler installation, bathroom fitting..."
                                  className={inputClass("resize-none")}
                                />
                              </div>
                              <div>
                                <Label required>
                                  Who are your target customers?
                                </Label>
                                <textarea
                                  required
                                  rows={3}
                                  value={form.targetCustomers}
                                  onChange={set("targetCustomers")}
                                  placeholder="e.g. Homeowners in South London aged 30–60, mainly emergency call-outs..."
                                  className={inputClass("resize-none")}
                                />
                              </div>
                              <div>
                                <Label>Do you have a launch deadline?</Label>
                                <input
                                  type="text"
                                  value={form.deadline}
                                  onChange={set("deadline")}
                                  placeholder="e.g. Within 2 weeks, by end of June"
                                  className={inputClass()}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {step === 2 && (
                          <motion.div
                            key="step2"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.25 }}
                            className="space-y-6"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-4">
                                <Palette
                                  size={16}
                                  className="text-emerald-600"
                                />
                                <span className="text-sm font-semibold text-slate-900">
                                  Design Preferences
                                </span>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <Label>Brand Colours (if you have them)</Label>
                                  <input
                                    type="text"
                                    value={form.brandColours}
                                    onChange={set("brandColours")}
                                    placeholder="e.g. Navy blue and gold, or #1A2E4A"
                                    className={inputClass()}
                                  />
                                </div>
                                <div>
                                  <Label>Design Style Preference</Label>
                                  <select
                                    value={form.designStyle}
                                    onChange={set("designStyle")}
                                    className={inputClass()}
                                  >
                                    <option value="" className="bg-white">
                                      Select a style...
                                    </option>
                                    {styleOptions.map((opt) => (
                                      <option
                                        key={opt}
                                        value={opt}
                                        className="bg-white"
                                      >
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <Label>Website References / Inspiration</Label>
                                  <input
                                    type="text"
                                    value={form.references}
                                    onChange={set("references")}
                                    placeholder="Links or names of sites you like the look of"
                                    className={inputClass()}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-slate-200 pt-5">
                              <div className="flex items-center gap-2 mb-4">
                                <Phone size={16} className="text-blue-600" />
                                <span className="text-sm font-semibold text-slate-900">
                                  Social Media Handles
                                </span>
                                <span className="text-xs text-slate-500">
                                  (so we can link them on your site)
                                </span>
                              </div>
                              <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                  <Label>Facebook</Label>
                                  <input
                                    type="text"
                                    value={form.facebook}
                                    onChange={set("facebook")}
                                    placeholder="facebook.com/yourbusiness"
                                    className={inputClass()}
                                  />
                                </div>
                                <div>
                                  <Label>Instagram</Label>
                                  <input
                                    type="text"
                                    value={form.instagram}
                                    onChange={set("instagram")}
                                    placeholder="@yourbusiness"
                                    className={inputClass()}
                                  />
                                </div>
                                <div>
                                  <Label>TikTok</Label>
                                  <input
                                    type="text"
                                    value={form.tiktok}
                                    onChange={set("tiktok")}
                                    placeholder="@yourbusiness"
                                    className={inputClass()}
                                  />
                                </div>
                                <div>
                                  <Label>LinkedIn</Label>
                                  <input
                                    type="text"
                                    value={form.linkedin}
                                    onChange={set("linkedin")}
                                    placeholder="linkedin.com/company/..."
                                    className={inputClass()}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-slate-200 pt-5">
                              <Label>Anything else we should know?</Label>
                              <textarea
                                rows={3}
                                value={form.notes}
                                onChange={set("notes")}
                                placeholder="Special requirements, content you already have, anything else..."
                                className={inputClass("resize-none")}
                              />
                            </div>

                            {error && (
                              <p className="text-sm text-rose-600 text-center">
                                {error}
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Navigation */}
                    <div className="border-t border-slate-200 px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
                      {step > 0 ? (
                        <button
                          type="button"
                          onClick={goBack}
                          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          <ArrowLeft size={14} /> Back
                        </button>
                      ) : (
                        <div />
                      )}

                      {step < 2 ? (
                        <Button
                          type="button"
                          variant="gradient"
                          size="lg"
                          onClick={goNext}
                          disabled={step === 0 ? !step1Valid : !step2Valid}
                          className="ml-auto"
                        >
                          Continue <ArrowRight size={16} />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          variant="gradient"
                          size="lg"
                          disabled={loading}
                          className="ml-auto"
                        >
                          {loading ? "Sending..." : "Submit Brief"}
                          {!loading && <ArrowRight size={16} />}
                        </Button>
                      )}
                    </div>
                  </form>
                </div>
              )}

              <p className="text-xs text-slate-500 text-center mt-4">
                By submitting, you agree to our Privacy Policy. We&apos;ll never
                share your information.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
