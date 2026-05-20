"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Users,
  UserPlus,
  Globe,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Zap,
  Activity,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { mockLeads, mockAutomations, revenueChartData } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

const kpis = [
  {
    label: "Total Revenue",
    value: "$84,200",
    change: 23.4,
    icon: DollarSign,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    label: "Active Clients",
    value: "142",
    change: 8.2,
    icon: Users,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    label: "New Leads",
    value: "38",
    change: 15.6,
    icon: UserPlus,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  {
    label: "Websites Live",
    value: "289",
    change: 12.1,
    icon: Globe,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
];

const pipelineData = [
  { name: "New", value: 12, color: "#3B82F6" },
  { name: "Qualified", value: 8, color: "#06B6D4" },
  { name: "Proposal", value: 6, color: "#F59E0B" },
  { name: "Negotiation", value: 4, color: "#EC4899" },
  { name: "Won", value: 8, color: "#10B981" },
];

const recentActivity = [
  { action: "New lead added", detail: "Marcus Thompson — Acme Corp", time: "2m ago", type: "lead" },
  { action: "Automation triggered", detail: "Welcome Sequence — Priya Patel", time: "8m ago", type: "automation" },
  { action: "Invoice paid", detail: "INV-0042 — RetailEdge Inc. ($2,800)", time: "1h ago", type: "invoice" },
  { action: "Project updated", detail: "RetailEdge Website — 65% complete", time: "2h ago", type: "project" },
  { action: "New client signed", detail: "Sarah Chen — Nexus Properties", time: "3h ago", type: "client" },
];

export default function DashboardView() {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl border border-riden-border p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.06) 100%)",
        }}
      >
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            Good morning, Admin 👋
          </h2>
          <p className="text-sm text-slate-400">
            You have <span className="text-blue-400 font-medium">3 leads</span> to follow up on
            and <span className="text-amber-400 font-medium">2 invoices</span> overdue today.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/portal/leads"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/10 border border-blue-500/20 text-sm text-blue-400 hover:bg-blue-600/20 transition-colors"
          >
            View Leads <ArrowRight size={14} />
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-xl border border-riden-border p-5 hover:border-white/10 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} border ${kpi.border} flex items-center justify-center`}>
                <kpi.icon size={18} className={kpi.color} />
              </div>
              <div
                className={`flex items-center gap-1 text-xs font-medium ${
                  kpi.change > 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {kpi.change > 0 ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                {Math.abs(kpi.change)}%
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{kpi.value}</div>
            <div className="text-xs text-slate-500">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass-card rounded-xl border border-riden-border p-5"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Revenue Overview</h3>
              <p className="text-xs text-slate-500">Last 6 months</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                Revenue
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-2 h-2 rounded-full bg-violet-400" />
                Leads
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0D1117",
                  border: "1px solid #1E2A3B",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey="leads" stroke="#8B5CF6" strokeWidth={2} fill="url(#colorLeads)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl border border-riden-border p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-1">Lead Pipeline</h3>
          <p className="text-xs text-slate-500 mb-4">38 total leads</p>
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={pipelineData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pipelineData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0D1117",
                    border: "1px solid #1E2A3B",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {pipelineData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-400">{item.name}</span>
                </div>
                <span className="text-white font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card rounded-xl border border-riden-border"
        >
          <div className="flex items-center justify-between p-5 border-b border-riden-border">
            <h3 className="text-sm font-semibold text-white">Recent Leads</h3>
            <Link href="/portal/leads" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-riden-border">
            {mockLeads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {lead.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{lead.name}</div>
                  <div className="text-xs text-slate-500 truncate">{lead.company}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={lead.status === "won" ? "success" : lead.status === "lost" ? "destructive" : lead.status === "qualified" ? "cyan" : "default"} className="text-[10px]">
                    {lead.status}
                  </Badge>
                  <span className="text-xs text-slate-500">{formatCurrency(lead.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-xl border border-riden-border"
        >
          <div className="flex items-center justify-between p-5 border-b border-riden-border">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity size={14} className="text-blue-400" />
              Activity Feed
            </h3>
            <span className="text-xs text-slate-500">Live</span>
          </div>
          <div className="divide-y divide-riden-border">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-7 h-7 rounded-lg bg-riden-muted border border-riden-border flex items-center justify-center flex-shrink-0 mt-0.5">
                  {item.type === "lead" && <UserPlus size={13} className="text-blue-400" />}
                  {item.type === "automation" && <Zap size={13} className="text-violet-400" />}
                  {item.type === "invoice" && <DollarSign size={13} className="text-emerald-400" />}
                  {item.type === "project" && <Globe size={13} className="text-cyan-400" />}
                  {item.type === "client" && <Users size={13} className="text-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white">{item.action}</div>
                  <div className="text-xs text-slate-500 truncate">{item.detail}</div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-600 flex-shrink-0">
                  <Clock size={10} />
                  {item.time}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Active Automations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="glass-card rounded-xl border border-riden-border"
      >
        <div className="flex items-center justify-between p-5 border-b border-riden-border">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Zap size={14} className="text-violet-400" />
            Active Automations
          </h3>
          <Link href="/portal/automation" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            Manage <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4 p-5">
          {mockAutomations.filter(a => a.status === "active").map((automation) => (
            <div key={automation.id} className="bg-riden-surface rounded-xl p-4 border border-riden-border">
              <div className="flex items-center justify-between mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-slate-500">{automation.runsToday} runs today</span>
              </div>
              <div className="text-sm font-medium text-white mb-1">{automation.name}</div>
              <div className="text-xs text-slate-500 mb-3">Trigger: {automation.trigger}</div>
              <div className="text-xs text-slate-600">
                {automation.runsTotal.toLocaleString()} total runs
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
