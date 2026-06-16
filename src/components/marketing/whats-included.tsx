"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Palette,
  Smartphone,
  MapPin,
  Gauge,
  MailCheck,
  Images,
  Globe,
  RefreshCw,
  Headphones,
  CalendarCheck,
  PackageCheck,
} from "lucide-react";

const features = [
  { icon: Palette, title: "Professional Website Design", desc: "A clean, modern site designed to win trust and turn visitors into enquiries." },
  { icon: Smartphone, title: "Mobile Friendly", desc: "Looks and works perfectly on phones, tablets and desktops." },
  { icon: MapPin, title: "Local SEO Setup", desc: "Built to be found on Google for your services and your area." },
  { icon: Gauge, title: "Fast Hosting", desc: "Secure, managed hosting with SSL included. Always fast and online." },
  { icon: MailCheck, title: "Contact Forms", desc: "Simple enquiry forms that send leads straight to your inbox." },
  { icon: Images, title: "Gallery & Reviews", desc: "Show off your work and your happy customers to build instant credibility." },
  { icon: Globe, title: "Domain Setup", desc: "We connect your domain (or help you get one) and handle the tech." },
  { icon: RefreshCw, title: "Ongoing Updates", desc: "Send us changes any time and we'll update your site for you." },
  { icon: Headphones, title: "Support Included", desc: "Friendly UK-based help whenever you need it, every plan." },
  { icon: CalendarCheck, title: "CRM & Booking Options", desc: "Add online booking and lead management on higher plans." },
];

export default function WhatsIncluded() {
  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-riden-dark via-riden-surface to-riden-dark" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-cyan-500/20 text-sm text-cyan-300 mb-6"
          >
            <PackageCheck size={14} />
            <span>What&apos;s Included</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Everything you need,{" "}
            <span className="gradient-text">all in one plan</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto"
          >
            No piecing things together from different suppliers. Your website and everything
            that keeps it running come as one simple package.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 5) * 0.06, duration: 0.45 }}
              className="glass-card rounded-2xl p-5 border border-riden-border hover:border-blue-500/30 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                <f.icon size={18} className="text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1.5 leading-snug">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
