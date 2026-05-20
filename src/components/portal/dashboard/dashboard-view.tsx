"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, Users, UserPlus, Globe, TrendingUp, TrendingDown,
  ArrowRight, Zap, Activity, Clock, RefreshCw, AlertCircle,
  type LucideIcon,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { mockAutomations } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

type KPI = { label: string; value: string; change: number; icon: LucideIcon; color: string; bg: string; border: string };
type PipelineItem = { name: string; value: number; color: string };
type RecentLead = { id: string; name: string; company: string | null; status: string; value: number };
type ChartPoint = { month: string; revenue: number; leads: number; clients: number };
type ActivityItem = { action: string; detail: string; time: string; type: string };

type DashboardStats = {
  user: { name: string };
  kpis: {
    totalRevenue: number; revenueGrowth: number;
    activeClients: number; clientsGrowth: number;
    newLeads: number; leadsGrowth: number;
    websitesLive: number; overdueInvoices: number;
    mrr: number;
  };
  pipeline: PipelineItem[];
  recentLeads: RecentLead[];
  revenueChart: ChartPoint[];
  recentActivity: ActivityItem[];
};

const STATUS_VARIANT: Record<string, "default" | "cyan" | "success" | "destructive" | "warning" | "violet"> = {
  new: "default", contacted: "violet", qualified: "cyan",
  proposal: "warning", won: "success", lost: "destructive",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function KPISkeleton() {
  return (
    <div className="glass-card rounded-xl border border-riden-border p-3 sm:p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-riden-muted" />
        <div className="w-12 h-4 rounded bg-riden-muted" />
      </div>
      <div className="w-24 h-7 rounded bg-riden-muted mb-1" />
      <div className="w-16 h-3 rounded bg-riden-muted" />
    </div>
  );
}

export default function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to load");
      setStats(await res.json());
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const kpis: KPI[] = stats
    ? [
        {
          label: "Total Revenue", value: formatCurrency(stats.kpis.totalRevenue),
          change: stats.kpis.revenueGrowth, icon: DollarSign,
          color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20",
        },
        {
          label: "Active Clients", value: String(stats.kpis.activeClients),
          change: stats.kpis.clientsGrowth, icon: Users,
          color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20",
        },
        {
          label: "New Leads (7d)", value: String(stats.kpis.newLeads),
          change: stats.kpis.leadsGrowth, icon: UserPlus,
          color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20",
        },
        {
          label: "Monthly Recurring", value: formatCurrency(stats.kpis.mrr ?? 0),
          change: 0, icon: Globe,
          color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20",
        },
      ]
    : [];

  const tooltipStyle = {
    contentStyle: { backgroundColor: "#0D1117", border: "1px solid #1E2A3B", borderRadius: "8px", color: "#fff", fontSize: "12px" },
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl border border-riden-border p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.06) 100%)" }}
      >
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            {greeting()}, {stats?.user?.name?.split(" ")[0] ?? "..."} 👋
          </h2>
          <p className="text-sm text-slate-400">
            {stats?.kpis.overdueInvoices ? (
              <>You have <span className="text-amber-400 font-medium">{stats.kpis.overdueInvoices} overdue invoice{stats.kpis.overdueInvoices > 1 ? "s" : ""}</span> and</>
            ) : "You have "}
            {" "}<span className="text-blue-400 font-medium">{stats?.kpis.newLeads ?? "..."} new leads</span> this week.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <button onClick={fetchStats} disabled={loading} className="p-2 rounded-lg bg-riden-muted border border-riden-border text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <Link
            href="/portal/leads"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/10 border border-blue-500/20 text-sm text-blue-400 hover:bg-blue-600/20 transition-colors"
          >
            View Leads <ArrowRight size={14} />
          </Link>
        </div>
      </motion.div>

      {error && (
        <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={14} /> {error}
          <button onClick={fetchStats} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <KPISkeleton key={i} />)
          : kpis.map((kpi, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl border border-riden-border p-3 sm:p-5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${kpi.bg} border ${kpi.border} flex items-center justify-center`}>
                    <kpi.icon size={16} className={kpi.color} />
                  </div>
                  {kpi.change !== 0 && (
                    <div className={`flex items-center gap-0.5 text-xs font-medium ${kpi.change > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {kpi.change > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {Math.abs(kpi.change)}%
                    </div>
                  )}
                </div>
                <div className="text-lg sm:text-2xl font-bold text-white mb-0.5 sm:mb-1 leading-tight">{kpi.value}</div>
                <div className="text-[10px] sm:text-xs text-slate-500 leading-tight">{kpi.label}</div>
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
          <div className="flex items-center justify-between mb-3 sm:mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Revenue Overview</h3>
              <p className="text-xs text-slate-500">Last 6 months</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-2 h-2 rounded-full bg-blue-400" /><span className="hidden sm:inline">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-2 h-2 rounded-full bg-violet-400" /><span className="hidden sm:inline">Leads</span>
              </div>
            </div>
          </div>
          <div className="h-[150px] sm:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.revenueChart ?? []}>
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
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="leads" stroke="#8B5CF6" strokeWidth={2} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl border border-riden-border p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-1">Lead Pipeline</h3>
          <p className="text-xs text-slate-500 mb-4">
            {stats ? stats.pipeline.reduce((s, p) => s + p.value, 0) : "..."} total leads
          </p>
          {stats && stats.pipeline.length > 0 ? (
            <>
              <div className="flex justify-center">
                <div className="h-[110px] sm:h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.pipeline} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                        {stats.pipeline.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-2 mt-2">
                {stats.pipeline.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-400">{item.name}</span>
                    </div>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-600 text-xs">
              No leads yet
            </div>
          )}
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
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-riden-border">
            <h3 className="text-sm font-semibold text-white">Recent Leads</h3>
            <Link href="/portal/leads" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-riden-border">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-riden-muted flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="w-32 h-3 rounded bg-riden-muted" />
                      <div className="w-20 h-2.5 rounded bg-riden-muted" />
                    </div>
                  </div>
                ))
              : stats?.recentLeads.length === 0
              ? <div className="py-10 text-center text-slate-500 text-sm">No leads yet — submit the contact form to get started.</div>
              : stats?.recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {lead.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{lead.name}</div>
                      <div className="text-xs text-slate-500 truncate">{lead.company ?? "—"}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={STATUS_VARIANT[lead.status] ?? "default"} className="text-[10px] capitalize">{lead.status}</Badge>
                      {lead.value > 0 && <span className="text-xs text-slate-500">{formatCurrency(lead.value)}</span>}
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
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-riden-border">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity size={14} className="text-blue-400" /> Activity Feed
            </h3>
            <span className="text-xs text-slate-500">Live</span>
          </div>
          <div className="divide-y divide-riden-border">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 animate-pulse">
                    <div className="w-7 h-7 rounded-lg bg-riden-muted flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="w-28 h-3 rounded bg-riden-muted" />
                      <div className="w-40 h-2.5 rounded bg-riden-muted" />
                    </div>
                  </div>
                ))
              : stats?.recentActivity.length === 0
              ? <div className="py-10 text-center text-slate-500 text-sm">No recent activity yet.</div>
              : stats?.recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-riden-muted border border-riden-border flex items-center justify-center flex-shrink-0 mt-0.5">
                      {item.type === "lead" && <UserPlus size={13} className="text-blue-400" />}
                      {item.type === "invoice" && <DollarSign size={13} className="text-emerald-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white">{item.action}</div>
                      <div className="text-xs text-slate-500 truncate">{item.detail}</div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-600 flex-shrink-0">
                      <Clock size={10} /> {item.time}
                    </div>
                  </div>
                ))}
          </div>
        </motion.div>
      </div>

      {/* Active Automations — demo data (full automation engine coming soon) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="glass-card rounded-xl border border-riden-border"
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-riden-border">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Zap size={14} className="text-violet-400" /> Active Automations
          </h3>
          <Link href="/portal/automation" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            Manage <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 p-3 sm:p-5">
          {mockAutomations.filter((a) => a.status === "active").map((automation) => (
            <div key={automation.id} className="bg-riden-surface rounded-xl p-4 border border-riden-border">
              <div className="flex items-center justify-between mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-slate-500">{automation.runsToday} runs today</span>
              </div>
              <div className="text-sm font-medium text-white mb-1">{automation.name}</div>
              <div className="text-xs text-slate-500 mb-3">Trigger: {automation.trigger}</div>
              <div className="text-xs text-slate-600">{automation.runsTotal.toLocaleString()} total runs</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
