"use client";

import React from "react";
import { motion } from "framer-motion";
import { Globe, Zap, Users, BarChart3, Calendar, Wrench, ArrowRight } from "lucide-react";
import Link from "next/link";

const services = [
  {
    icon: Globe,
    title: "Website Design & Build",
    description:
      "Bespoke, professionally crafted websites delivered in 2–5 business days. Every site is mobile-responsive, fast-loading, and built to turn visitors into paying customers.",
    features: ["Custom design", "Mobile-responsive", "SEO-ready structure", "2–5 business day delivery"],
    gradient: "from-blue-500/20 to-blue-600/5",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    dotColor: "bg-blue-400",
    border: "hover:border-blue-500/30",
    tag: "Core Service",
  },
  {
    icon: Zap,
    title: "Workflow Automation",
    description:
      "We set up automations that handle the repetitive work for you — from lead follow-up emails to client onboarding sequences — so nothing slips through the cracks.",
    features: ["Lead follow-up emails", "Client onboarding flows", "Booking confirmations", "CRM automation"],
    gradient: "from-violet-500/20 to-violet-600/5",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    dotColor: "bg-violet-400",
    border: "hover:border-violet-500/30",
    tag: null,
  },
  {
    icon: Users,
    title: "CRM Dashboard",
    description:
      "A personal CRM dashboard to manage your leads, clients, projects, and invoices — all in one place. Available on Pro+ and Enterprise plans.",
    features: ["Lead management", "Client tracking", "Invoice management", "Pipeline overview"],
    gradient: "from-cyan-500/20 to-cyan-600/5",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
    dotColor: "bg-cyan-400",
    border: "hover:border-cyan-500/30",
    tag: "Pro+ & Enterprise",
  },
  {
    icon: BarChart3,
    title: "Analytics & Tracking",
    description:
      "See exactly where your visitors come from, which pages perform best, and which sources are generating real leads — so you can make informed decisions.",
    features: ["Visitor tracking", "Lead source analytics", "Conversion monitoring", "Monthly reporting"],
    gradient: "from-emerald-500/20 to-emerald-600/5",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    dotColor: "bg-emerald-400",
    border: "hover:border-emerald-500/30",
    tag: null,
  },
  {
    icon: Calendar,
    title: "Booking & Scheduling",
    description:
      "Let clients book appointments or consultations directly from your website. Integrated into your CRM so every booking becomes a tracked lead automatically.",
    features: ["Online booking calendar", "Automated reminders", "Service selection", "CRM integration"],
    gradient: "from-amber-500/20 to-amber-600/5",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    dotColor: "bg-amber-400",
    border: "hover:border-amber-500/30",
    tag: "Pro+ & Enterprise",
  },
  {
    icon: Wrench,
    title: "Maintenance & Support",
    description:
      "Ongoing website maintenance, content updates, security monitoring, and support — so your site stays fast, up to date, and working exactly as it should.",
    features: ["Monthly updates", "Security monitoring", "Content changes", "Priority support"],
    gradient: "from-rose-500/20 to-rose-600/5",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
    dotColor: "bg-rose-400",
    border: "hover:border-rose-500/30",
    tag: null,
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export default function Services() {
  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-riden-dark" />
      <div className="absolute inset-0 grid-pattern opacity-30" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-violet-500/20 text-sm text-violet-300 mb-6"
          >
            <Zap size={14} />
            <span>What We Do</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Everything Your Business{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #60a5fa, #a78bfa)" }}>Needs to Grow</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto"
          >
            From a professional website and CRM dashboard to booking systems,
            automation, and ongoing support — we handle the digital side so you
            can focus on running your business.
          </motion.p>
        </div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((service, i) => (
            <motion.div
              key={i}
              variants={cardVariants}
              className={`relative group glass-card rounded-2xl p-6 border border-riden-border transition-all duration-300 hover:shadow-card-hover ${service.border} flex flex-col`}
            >
              {/* Tag */}
              {service.tag && (
                <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium">
                  {service.tag}
                </div>
              )}

              {/* Gradient bg on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${service.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              <div className="relative flex flex-col flex-1">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${service.iconBg} flex items-center justify-center mb-5`}>
                  <service.icon size={22} className={service.iconColor} />
                </div>

                <h3 className="text-lg font-semibold text-white mb-3">{service.title}</h3>

                <p className="text-sm text-slate-400 leading-relaxed mb-5">{service.description}</p>

                <ul className="space-y-2 mb-6 flex-1">
                  {service.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-400">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${service.dotColor}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA — links to contact, not back to this page */}
                <Link
                  href="/contact"
                  className={`inline-flex items-center gap-2 text-sm font-medium ${service.iconColor} group-hover:gap-3 transition-all duration-200 mt-auto`}
                >
                  Get started <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
