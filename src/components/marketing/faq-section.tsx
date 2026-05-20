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
    a: "Our AI generates unique, conversion-optimized websites based on your specific business, industry, and target audience. Every site is custom — not a template reused across clients. The AI learns from thousands of high-performing websites to create something genuinely effective for your market.",
  },
  {
    q: "Do I need technical knowledge to use the CRM platform?",
    a: "Not at all. Our CRM is designed to be intuitive for non-technical users. If you can use email or a smartphone, you can use our CRM. We also provide full onboarding and training to get your team up to speed.",
  },
  {
    q: "Can you integrate with the tools I already use?",
    a: "Yes. We integrate with hundreds of popular tools including Stripe, Zapier, Mailchimp, Google Workspace, Slack, QuickBooks, and many more. If you have a specific integration need, ask us — we can build custom integrations too.",
  },
  {
    q: "What kind of support do you provide?",
    a: "All plans include email and chat support. Growth and Enterprise plans include priority support with faster response times. Enterprise clients get a dedicated account manager available for calls and ongoing strategy sessions.",
  },
  {
    q: "Is there a contract or can I cancel anytime?",
    a: "We offer month-to-month plans with no long-term contracts required. Annual plans receive a significant discount. You can cancel anytime with 30 days notice — no hidden fees or cancellation penalties.",
  },
  {
    q: "Do you handle hosting and maintenance?",
    a: "Yes. All websites we build include managed hosting, SSL certificates, security monitoring, and regular updates. You don't need to manage any infrastructure — we handle everything so you can focus on your business.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-riden-surface/50" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-16">
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

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl border border-riden-border overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-riden-border pt-4">
                      <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
