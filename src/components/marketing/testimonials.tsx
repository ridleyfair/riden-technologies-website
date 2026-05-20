"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Marcus Chen",
    role: "CEO",
    company: "TechVenture Co.",
    avatar: "MC",
    avatarBg: "from-blue-500 to-cyan-500",
    rating: 5,
    text: "Riden Technologies completely transformed our digital presence. Our new AI-powered website generated 3x more leads in the first month alone. The CRM system they built has become the backbone of our entire sales operation.",
  },
  {
    name: "Sarah Williams",
    role: "Founder",
    company: "Elevate Health",
    avatar: "SW",
    avatarBg: "from-violet-500 to-purple-500",
    rating: 5,
    text: "The automation system they built for us saves 40+ hours per week. From lead capture to client onboarding, everything runs automatically. It's like having a team of 10 working 24/7 without the overhead.",
  },
  {
    name: "James Rodriguez",
    role: "Director of Growth",
    company: "Nexus Properties",
    avatar: "JR",
    avatarBg: "from-emerald-500 to-teal-500",
    rating: 5,
    text: "We went from struggling with spreadsheets to having a world-class CRM in under 2 weeks. The lead scoring AI alone increased our conversion rate by 67%. Riden Technologies delivers enterprise quality at a fraction of the cost.",
  },
  {
    name: "Priya Patel",
    role: "CMO",
    company: "CloudScale SaaS",
    avatar: "PP",
    avatarBg: "from-rose-500 to-pink-500",
    rating: 5,
    text: "Honestly the best investment we've made in our business. The website they generated ranks on page 1 for our target keywords, and the integrated CRM has completely streamlined our sales process. ROI was immediate.",
  },
  {
    name: "David Kim",
    role: "Owner",
    company: "Kim Law Group",
    avatar: "DK",
    avatarBg: "from-amber-500 to-orange-500",
    rating: 5,
    text: "As a law firm, we needed something professional and compliant. Riden delivered a stunning website with a client portal that our clients love. The booking system alone has eliminated all the back-and-forth scheduling.",
  },
  {
    name: "Lisa Thompson",
    role: "VP Operations",
    company: "RetailEdge Inc.",
    avatar: "LT",
    avatarBg: "from-cyan-500 to-blue-500",
    rating: 5,
    text: "The analytics dashboard gives us insights we never had before. We can see exactly where our leads come from, which automations are working, and where revenue is growing. Decision-making has never been this data-driven.",
  },
];

export default function Testimonials() {
  return (
    <section className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-riden-dark via-riden-surface to-riden-dark" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-amber-500/20 text-sm text-amber-300 mb-6"
          >
            <Star size={14} className="fill-current" />
            <span>Client Success Stories</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Trusted by <span className="gradient-text">500+ Businesses</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto"
          >
            From startups to enterprises, businesses across every industry trust
            Riden Technologies to power their digital growth.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="glass-card rounded-2xl p-6 border border-riden-border hover:border-white/10 transition-all duration-300 group"
            >
              {/* Quote Icon */}
              <Quote size={24} className="text-blue-400/30 mb-4" />

              {/* Stars */}
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={14} className="text-amber-400 fill-current" />
                ))}
              </div>

              {/* Text */}
              <p className="text-sm text-slate-300 leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatarBg} flex items-center justify-center text-sm font-bold text-white`}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-slate-500">
                    {t.role} · {t.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
