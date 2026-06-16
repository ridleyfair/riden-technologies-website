"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "How much does a website cost?",
    a: "We keep it simple with one plan: a £199 one-time build fee plus £29.99/month. That covers your website design, hosting, SSL, local SEO, unlimited updates and friendly UK support. There are no hidden fees and no long-term contracts.",
  },
  {
    q: "Do you manage updates for me?",
    a: "Yes. We handle all the updates for you. Need new photos, a price change or a new service added? Just send it over and we'll make the changes, usually the same day. You never have to log in or touch any code.",
  },
  {
    q: "Can I preview the website first?",
    a: "Absolutely. We build a live preview of your website around your business so you can see exactly what it will look like before anything goes live. You review it and request any changes, and we refine it until you're happy.",
  },
  {
    q: "Do you help with SEO?",
    a: "Yes. Every website is set up to be found on Google for the services you offer in the areas you work. Higher plans include advanced local SEO, service-specific pages and Google Business optimisation to help you rank higher and get more enquiries.",
  },
  {
    q: "Can you redesign my old website?",
    a: "Of course. Got an old or tired website that isn't winning you work? We rebuild it into something modern and easy to use, keeping the bits that work and refreshing the rest, so it brings in more enquiries.",
  },
  {
    q: "Can I use my own domain?",
    a: "Of course. If you already have a domain we'll connect it for you, and if you don't have one yet we'll help you choose and set one up. Either way, we handle all the technical bits.",
  },
  {
    q: "How quickly can my website go live?",
    a: "Most websites are designed, built and launched within days, not months. You'll usually see your preview within a few working days, and once you're happy we publish it live and handle the rest.",
  },
  {
    q: "Do I need to do anything technical?",
    a: "Not at all. We take care of the design, hosting, domain, updates and SEO for you. There's nothing to install and nothing to log into. Just tell us what you need and we make it happen.",
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
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.04, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl overflow-hidden h-fit bg-white ring-1 ring-slate-200 shadow-sm transition-shadow hover:shadow-md"
    >
      <button
        onClick={() => setOpenIndex(isOpen ? null : index)}
        className="w-full flex items-start justify-between p-4 sm:p-5 text-left gap-3 hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-900 leading-snug">{faq.q}</span>
        <ChevronDown
          size={16}
          className={`text-slate-400 flex-shrink-0 mt-0.5 transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-600" : ""}`}
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
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t border-slate-100">
              <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-20 sm:py-28 bg-white overflow-hidden">
      {/* soft brand wash */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-[40rem] rounded-full bg-blue-100/30 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <motion.span
            {...fadeUp}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide ring-1 ring-blue-100"
          >
            <HelpCircle size={13} />
            Common Questions
          </motion.span>

          <motion.h2
            {...fadeUp}
            transition={{ delay: 0.05 }}
            className="mt-5 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-slate-900"
          >
            Got <span className="gradient-text-brand">questions?</span>
          </motion.h2>

          <motion.p
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed"
          >
            Everything you need to know before getting started.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          {faqs.map((faq, i) => (
            <FAQItem key={i} faq={faq} index={i} openIndex={openIndex} setOpenIndex={setOpenIndex} />
          ))}
        </div>
      </div>
    </section>
  );
}
