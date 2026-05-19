"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, TrendingUp, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "500+", label: "Businesses Transformed" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "3x", label: "Average Revenue Growth" },
  { value: "24/7", label: "AI-Powered Support" },
];

const floatingCards = [
  {
    icon: TrendingUp,
    title: "Lead Generation",
    value: "+340%",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    delay: 0,
  },
  {
    icon: Zap,
    title: "Automation Active",
    value: "127 flows",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    delay: 0.5,
  },
  {
    icon: Globe,
    title: "Sites Generated",
    value: "1,247",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    delay: 1,
  },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute inset-0 dot-pattern opacity-40" />

      {/* Glows */}
      <div className="hero-glow top-1/4 left-1/4 bg-blue-600/20" />
      <div className="hero-glow bottom-1/4 right-1/4 bg-violet-600/15" />

      <div className="relative max-w-7xl mx-auto px-6 py-20 text-center">
        {/* Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-blue-500/20 text-sm text-blue-300 mb-8"
        >
          <Sparkles size={14} className="text-blue-400" />
          <span>AI-Powered Business Transformation Platform</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-6"
        >
          Intelligent Solutions.{" "}
          <span className="gradient-text">Powerful Results.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10"
        >
          We build AI-powered websites, automation systems, and CRM platforms
          that transform businesses and drive{" "}
          <span className="text-white font-medium">measurable growth</span>.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link href="/contact">
            <Button variant="gradient" size="xl" className="group">
              Book a Strategy Call
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/our-work">
            <Button variant="outline" size="xl" className="group gap-3">
              <span className="w-8 h-8 rounded-full bg-riden-muted border border-riden-border flex items-center justify-center">
                <Play size={12} className="text-white ml-0.5" />
              </span>
              View Our Work
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 max-w-3xl mx-auto"
        >
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Floating Cards */}
          {floatingCards.map((card, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: card.delay,
                ease: "easeInOut",
              }}
              className={cn(
                "absolute z-10 glass-card rounded-xl p-3 flex items-center gap-3 border",
                card.border,
                i === 0 && "-left-4 top-1/3 hidden md:flex",
                i === 1 && "-right-4 top-1/4 hidden md:flex",
                i === 2 && "-right-8 bottom-1/4 hidden lg:flex"
              )}
            >
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon size={16} className={card.color} />
              </div>
              <div>
                <div className="text-xs text-slate-500">{card.title}</div>
                <div className={`text-sm font-bold ${card.color}`}>{card.value}</div>
              </div>
            </motion.div>
          ))}

          {/* Main Dashboard Frame */}
          <div className="glass-card rounded-2xl border border-riden-border overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
            {/* Browser Chrome */}
            <div className="bg-riden-surface border-b border-riden-border px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <div className="flex-1 bg-riden-muted rounded-md px-3 py-1 text-xs text-slate-500 font-mono">
                portal.ridentechnologies.com/dashboard
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-6 bg-riden-dark">
              {/* KPI Row */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Total Revenue", value: "$84,200", change: "+23%", color: "text-emerald-400" },
                  { label: "Active Clients", value: "142", change: "+8%", color: "text-blue-400" },
                  { label: "New Leads", value: "38", change: "+15%", color: "text-violet-400" },
                  { label: "Websites Live", value: "289", change: "+12%", color: "text-cyan-400" },
                ].map((kpi, i) => (
                  <div key={i} className="bg-riden-surface rounded-xl p-4 border border-riden-border">
                    <div className="text-xs text-slate-500 mb-1">{kpi.label}</div>
                    <div className="text-xl font-bold text-white">{kpi.value}</div>
                    <div className={`text-xs font-medium ${kpi.color}`}>{kpi.change} this month</div>
                  </div>
                ))}
              </div>

              {/* Chart Placeholder */}
              <div className="bg-riden-surface rounded-xl p-4 border border-riden-border mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium text-white">Revenue Overview</div>
                  <div className="text-xs text-slate-500">Last 6 months</div>
                </div>
                <div className="h-32 flex items-end gap-2">
                  {[40, 65, 45, 80, 55, 95].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col gap-1 items-center">
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-blue-600/50 to-blue-400/50 border border-blue-500/20"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-riden-surface rounded-xl p-4 border border-riden-border">
                  <div className="text-xs text-slate-500 mb-3">Recent Leads</div>
                  {["Acme Corp", "TechStart Inc", "GlobalTrade LLC"].map((name, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
                        {name[0]}
                      </div>
                      <span className="text-xs text-slate-300">{name}</span>
                      <span className="ml-auto text-xs text-emerald-400">New</span>
                    </div>
                  ))}
                </div>
                <div className="bg-riden-surface rounded-xl p-4 border border-riden-border">
                  <div className="text-xs text-slate-500 mb-3">Active Automations</div>
                  {["Email Follow-up", "Lead Scoring", "Onboarding Flow"].map((name, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-slate-300">{name}</span>
                      <span className="ml-auto text-xs text-slate-500">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-riden-dark to-transparent pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
