"use client";

import React from "react";
import { motion } from "framer-motion";
import { Globe, Zap, Users, BarChart3, Bot, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

const services = [
  {
    icon: Globe,
    title: "AI Website Generation",
    description:
      "Generate premium, conversion-optimized websites in minutes using our proprietary AI engine. Each site is unique, responsive, and built for performance.",
    features: ["Instant generation", "SEO optimized", "Mobile-first", "Custom branding"],
    gradient: "from-blue-500/20 to-blue-600/5",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    border: "hover:border-blue-500/30",
    tag: "Most Popular",
  },
  {
    icon: Zap,
    title: "Workflow Automation",
    description:
      "Eliminate repetitive tasks with intelligent automation systems. From lead nurturing to invoicing, we automate your entire business workflow.",
    features: ["Email automation", "Lead workflows", "Task triggers", "CRM integration"],
    gradient: "from-violet-500/20 to-violet-600/5",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    border: "hover:border-violet-500/30",
    tag: null,
  },
  {
    icon: Users,
    title: "CRM Platform",
    description:
      "A full-featured CRM built for growth. Manage leads, clients, projects, and revenue from a single, intuitive dashboard.",
    features: ["Lead pipelines", "Client management", "Deal tracking", "Team collaboration"],
    gradient: "from-cyan-500/20 to-cyan-600/5",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
    border: "hover:border-cyan-500/30",
    tag: null,
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description:
      "Real-time analytics and AI-powered insights that turn your data into actionable growth strategies and measurable outcomes.",
    features: ["Revenue tracking", "Lead analytics", "Conversion rates", "AI reports"],
    gradient: "from-emerald-500/20 to-emerald-600/5",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    border: "hover:border-emerald-500/30",
    tag: null,
  },
  {
    icon: Bot,
    title: "AI Lead Generation",
    description:
      "Intelligent lead scoring, automated outreach, and AI-driven qualification systems that fill your pipeline with high-intent prospects.",
    features: ["Lead scoring", "Auto-outreach", "Qualification AI", "Pipeline management"],
    gradient: "from-amber-500/20 to-amber-600/5",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    border: "hover:border-amber-500/30",
    tag: "New",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Bank-grade security, role-based access control, and compliance-ready infrastructure for businesses that take data seriously.",
    features: ["Role-based access", "Data encryption", "Audit logs", "SOC2 ready"],
    gradient: "from-rose-500/20 to-rose-600/5",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
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
    <section className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
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
            <span>Our Solutions</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Everything Your Business{" "}
            <span className="gradient-text">Needs to Scale</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto"
          >
            From AI-powered websites to enterprise CRM systems — we deliver the
            complete digital infrastructure modern businesses demand.
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
              className={`relative group glass-card rounded-2xl p-6 border border-riden-border transition-all duration-300 hover:shadow-card-hover ${service.border} cursor-pointer`}
            >
              {/* Tag */}
              {service.tag && (
                <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium">
                  {service.tag}
                </div>
              )}

              {/* Gradient bg */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${service.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              <div className="relative">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${service.iconBg} flex items-center justify-center mb-5`}>
                  <service.icon size={22} className={service.iconColor} />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-3">{service.title}</h3>

                {/* Description */}
                <p className="text-sm text-slate-400 leading-relaxed mb-5">{service.description}</p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {service.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href="/solutions"
                  className={`inline-flex items-center gap-2 text-sm font-medium ${service.iconColor} group-hover:gap-3 transition-all duration-200`}
                >
                  Learn more <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
