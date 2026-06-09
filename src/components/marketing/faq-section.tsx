"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "How quickly can you build and launch my website?",
    a: "Most websites are fully designed, built, and launched within 2–5 business days. For larger projects with more pages or custom features, we'll give you a precise timeline during your discovery call.",
  },
  {
    q: "Is the website built from scratch or from a template?",
    a: "Every website we build is crafted from scratch, tailored specifically to your business. We don't reuse templates across clients — your site will be unique to you.",
  },
  {
    q: "Do I need any technical knowledge to use the CRM?",
    a: "Not at all. Our CRM is designed to be simple and intuitive — if you can use a smartphone, you can use it. We also provide full onboarding and training when we hand over.",
  },
  {
    q: "Can you work with the tools I already use?",
    a: "Yes. We can integrate with most popular tools including Stripe, Google Workspace, Mailchimp, Zapier, and many more. Just let us know what you use and we'll make it work.",
  },
  {
    q: "What support do I get after launch?",
    a: "All plans include ongoing maintenance and support. We handle updates, security monitoring, and content changes — so your site stays fast, secure, and up to date.",
  },
  {
    q: "Is there a long-term contract?",
    a: "No. Our maintenance plans are month-to-month with no long-term commitment required. Annual plans come with a discount. Cancel anytime with 30 days notice.",
  },
  {
    q: "Do you handle hosting?",
    a: "Yes — all websites include managed hosting, an SSL certificate, and security monitoring. We take care of everything technical so you can focus on running your business.",
  },
  {
    q: "Can you migrate my existing website?",
    a: "Absolutely. We handle full migrations from WordPress, Wix, Squarespace, or any other platform — with zero downtime and all your content preserved.",
  },
];

function FAQItem({ faq, index, openIndex, setOpenIndex }: {
  faq: { q: string; a: string };
  index: number;
  openIndex: number | null;
  setOpenIndex: (i: number | null) => void;
}) {
  const isOpen = openIndex === index;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl overflow-hidden h-fit"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <button
        onClick={() => setOpenIndex(isOpen ? null : index)}
        className="w-full flex items-start justify-between p-4 sm:p-5 text-left gap-3 hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-sm font-medium text-white leading-snug">{faq.q}</span>
        <ChevronDown
          size={16}
          className={`text-slate-400 flex-shrink-0 mt-0.5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden" style={{ background: "rgba(10,13,26,0.5)" }}>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/20 bg-blue-500/5 text-sm text-blue-300 mb-6"
          >
            <HelpCircle size={14} />
            <span>Common Questions</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Got{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #60a5fa, #a78bfa)" }}>
              Questions?
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-400"
          >
            Everything you need to know before getting started.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {faqs.map((faq, i) => (
            <FAQItem key={i} faq={faq} index={i} openIndex={openIndex} setOpenIndex={setOpenIndex} />
          ))}
        </div>
      </div>
    </section>
  );
}
