"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const contactInfo = [
  { icon: Mail, label: "Email Us", value: "inquiries@ridentechnologies.com" },
  { icon: MapPin, label: "Location", value: "London, UK" },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    service: "",
    message: "",
  });

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
      if (!res.ok) throw new Error("Failed to send");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please email us directly at inquiries@ridentechnologies.com");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 dot-pattern opacity-30" />
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-bold text-white mb-6"
          >
            Let&apos;s Build Something{" "}
            <span className="gradient-text">Extraordinary</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto"
          >
            Book a free strategy call and discover how we can transform your
            business with AI-powered technology.
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-riden-dark">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Left Info */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-bold text-white mb-4">
                  Get in Touch
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  Whether you&apos;re ready to start a project or just want to
                  explore what&apos;s possible, we&apos;re here to help you find the
                  right path forward.
                </p>
              </motion.div>

              <div className="space-y-4">
                {contactInfo.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 glass-card p-4 rounded-xl border border-riden-border"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <item.icon size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">{item.label}</div>
                      <div className="text-sm font-medium text-white">{item.value}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* What to Expect */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="glass-card p-6 rounded-xl border border-riden-border"
              >
                <h3 className="text-sm font-semibold text-white mb-4">
                  What happens next?
                </h3>
                <ul className="space-y-3">
                  {[
                    "We review your submission within 24 hours",
                    "Schedule a 30-min discovery call",
                    "Receive a custom strategy proposal",
                    "Begin your digital transformation",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                      <span className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {step}
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
                <div className="glass-card rounded-2xl border border-riden-border p-12 text-center h-full flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                    <CheckCircle size={32} className="text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Message Sent!</h3>
                  <p className="text-slate-400 max-w-sm">
                    Thanks for reaching out. Our team will get back to you within 24 hours
                    to schedule your strategy call.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="glass-card rounded-2xl border border-riden-border p-8 space-y-5"
                >
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="John Smith"
                        className="w-full bg-riden-muted border border-riden-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="john@company.com"
                        className="w-full bg-riden-muted border border-riden-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="Acme Corp"
                      className="w-full bg-riden-muted border border-riden-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Service Interested In</label>
                    <select
                      value={form.service}
                      onChange={(e) => setForm({ ...form, service: e.target.value })}
                      className="w-full bg-riden-muted border border-riden-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                    >
                      <option value="" className="bg-riden-surface">Select a service...</option>
                      <option value="website" className="bg-riden-surface">AI Website Generation</option>
                      <option value="crm" className="bg-riden-surface">CRM Platform</option>
                      <option value="automation" className="bg-riden-surface">Workflow Automation</option>
                      <option value="analytics" className="bg-riden-surface">Analytics & Insights</option>
                      <option value="full" className="bg-riden-surface">Full Platform Suite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Message *</label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us about your business goals and what you're looking to achieve..."
                      className="w-full bg-riden-muted border border-riden-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-rose-400 text-center">{error}</p>
                  )}

                  <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
                    <Send size={16} />
                    {loading ? "Sending..." : "Send Message & Book Strategy Call"}
                  </Button>

                  <p className="text-xs text-slate-500 text-center">
                    By submitting, you agree to our Privacy Policy. We&apos;ll never share your information.
                  </p>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
