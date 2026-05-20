"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "How quickly can you build and launch my website?",
    a: "Most websites are fully built, tested, and launched within 7–14 business days. For more complex projects with custom features, it may take up to 3–4 weeks. We'll give you a precise timeline during your strategy call.",
  },
  {
    q: "What makes your AI-powered websites different from templates?",
    a: "Our AI generates unique, conversion-optimized websites based on your specific business, industry, and target audience. Every site is custom — not a template reused across clients.",
  },
  {
    q: "Do I need technical knowledge to use the CRM platform?",
    a: "Not at all. Our CRM is designed to be intuitive for non-technical users. If you can use email or a smartphone, you can use our CRM. We also provide full onboarding and training.",
  },
  {
    q: "Can you integrate with the tools I already use?",
    a: "Yes. We integrate with hundreds of popular tools including Stripe, Zapier, Mailchimp, Google Workspace, Slack, QuickBooks, and many more. Custom integrations are available too.",
  },
  {
    q: "What kind of support do you provide?",
    a: "All plans include email and chat support. Growth and Enterprise plans include priority support with faster response times. Enterprise clients get a dedicated account manager.",
  },
  {
    q: "Is there a contract or can I cancel anytime?",
    a: "We offer month-to-month plans with no long-term contracts required. Annual plans receive a significant discount. Cancel anytime with 30 days notice — no hidden fees.",
  },
  {
    q: "Do you handle hosting and maintenance?",
    a: "Yes. All websites include managed hosting, SSL certificates, security monitoring, and regular updates. We handle everything so you can focus on your business.",
  },
  {
    q: "Can you migrate my existing website?",
    a: "Absolutely. We handle full migrations from any platform — WordPress, Wix, Squarespace, or custom-built sites — with zero downtime and full content preservation.",
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
      className="glass-card rounded-xl border border-riden-border overflow-hidden h-fit"
    >
      <button
        onClick={() => setOpenIndex(isOpen ? null : index)}
        className="w-full flex items-start justify-between p-4 sm:p-5 text-left hover:bg-white/[0.02] transition-colors gap-3"
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
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-riden-border pt-3">
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
    <section className="relative py-16 sm:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-riden-surface/50" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-blue-500/20 text-sm text-blue-300 mb-6"
          >
            <HelpCircle size={14} />
            <span>Frequently Asked Questions</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Got <span className="gradient-text">Questions?</span>
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
            <FAQItem
              key={i}
              faq={faq}
              index={i}
              openIndex={openIndex}
              setOpenIndex={setOpenIndex}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
