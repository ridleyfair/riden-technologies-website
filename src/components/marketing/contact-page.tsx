"use client";

import { motion } from "framer-motion";
import { Mail, MapPin } from "lucide-react";
import UniversalBriefForm from "@/components/marketing/universal-brief-form";

const contactInfo = [
  { icon: Mail,    label: "Email Us",  value: "enquiries@ridentechnologies.com" },
  { icon: MapPin,  label: "Location",  value: "London, UK" },
];

export default function ContactPage() {
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
            ⚡ Website live within 24 hours
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
            Fill in your brief below and we&apos;ll build a professional website
            tailored to your trade — ready to go live today.
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
                  submit, we&apos;ll review your brief and reach out within 24 hours.
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
                      <div className="text-sm font-medium text-slate-900">{item.value}</div>
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
                    "Launch in 24 hours",
                  ].map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="w-5 h-5 rounded-full bg-blue-50 ring-1 ring-blue-100 text-xs font-semibold text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center justify-center gap-6 text-xs text-slate-500"
              >
                <span>✓ No obligation</span>
                <span>✓ No upfront payment</span>
                <span>✓ Cancel any time</span>
              </motion.div>
            </div>

            {/* Form — kept dark to match /start */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-3"
            >
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
                <UniversalBriefForm />
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
}
