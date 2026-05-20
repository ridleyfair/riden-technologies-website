"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Eye, Users, MousePointerClick, FileText, Activity,
  TrendingUp, Globe, Smartphone, Monitor, RefreshCw, Wifi,
  type LucideIcon,
} from "lucide-react";
import { relativeTime } from "@/lib/relative-time";

type AnalyticsStats = {
  overview: {
    pageViews: number; uniqueVisitors: number; totalClicks: number;
    formSubmissions: number; liveVisitors: number; conversionRate: number;
  };
  topPages: Array<{ path: string; views: number }>;
  trafficSources: Array<{ source: string; count: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  recentEvents: Array<{ id: string; type: string; path: string; device: string; createdAt: string }>;
};

const DEVICE_COLORS: Record<string, string> = {
  Desktop: "#3B82F6",
  Mobile: "#8B5CF6",
  Tablet: "#06B6D4",
  Unknown: "#64748b",
};

const EVENT_LABELS: Record<string, string> = {
  page_view: "Page View",
  click: "Click",
  form_submit: "Form Submit",
  heartbeat: "Heartbeat",
};

const tooltipStyle = {
  contentStyle: { backgroundColor: "#0D1117", border: "1px solid #1E2A3B", borderRadius: "8px", color: "#fff", fontSize: "12px" },
};

function StatCard({ label, value, icon: Icon, color, sublabel }: {
  label: string; value: string | number; icon: LucideIcon;
  color: string; sublabel?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl border border-riden-border p-4 sm:p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center`}>
          <Icon size={16} className={color} />
        </div>
        {sublabel && <span className="text-[10px] text-slate-600">{sublabel}</span>}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/stats");
      const data = await res.json();
      setStats(data);
      setLiveCount(data.overview?.liveVisitors ?? 0);
    } catch {
      // keep whatever we had
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for live visitors every 30s
  useEffect(() => {
    fetchStats();
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/analytics/stats");
        const data = await res.json();
        setLiveCount(data.overview?.liveVisitors ?? 0);
      } catch {}
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const hasData = stats && stats.overview.pageViews > 0;

  const overviewCards = stats ? [
    { label: "Page Views (30d)", value: stats.overview.pageViews.toLocaleString(), icon: Eye, color: "text-blue-400", sublabel: "Last 30 days" },
    { label: "Unique Visitors", value: stats.overview.uniqueVisitors.toLocaleString(), icon: Users, color: "text-violet-400" },
    { label: "Total Clicks", value: stats.overview.totalClicks.toLocaleString(), icon: MousePointerClick, color: "text-cyan-400" },
    { label: "Form Submissions", value: stats.overview.formSubmissions.toLocaleString(), icon: FileText, color: "text-amber-400" },
    { label: "Conversion Rate", value: `${stats.overview.conversionRate}%`, icon: TrendingUp, color: "text-emerald-400", sublabel: "Submit → Lead" },
    { label: "Live Visitors", value: liveCount.toLocaleString(), icon: Wifi, color: "text-green-400", sublabel: "Right now" },
  ] : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">Website Analytics</h2>
          <p className="text-xs sm:text-sm text-slate-500">Real visitor data from your public website</p>
        </div>
        <button
          onClick={fetchStats}
          className="p-2 rounded-lg bg-riden-muted border border-riden-border text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {!hasData && !loading && (
        <div className="glass-card rounded-xl border border-riden-border p-8 text-center">
          <Globe size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No analytics data yet</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            The tracking script is installed on your public pages. Visit your website to start recording data,
            or run <code className="text-blue-400 bg-riden-muted px-1.5 py-0.5 rounded text-xs">POST /api/migrate</code> first if you haven&apos;t already.
          </p>
        </div>
      )}

      {/* Overview KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl border border-riden-border p-4 sm:p-5 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-riden-muted mb-3" />
                <div className="w-16 h-7 rounded bg-riden-muted mb-1.5" />
                <div className="w-20 h-3 rounded bg-riden-muted" />
              </div>
            ))
          : overviewCards.map((card, i) => (
              <StatCard key={i} {...card} />
            ))}
      </div>

      {/* Live Visitors Banner */}
      {liveCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-3 flex items-center gap-3"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <p className="text-sm text-emerald-400 font-medium">
            {liveCount} visitor{liveCount !== 1 ? "s" : ""} currently on your website
          </p>
          <span className="ml-auto text-xs text-slate-600">Updates every 30s</span>
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {/* Traffic Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl border border-riden-border p-4 sm:p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-1">Traffic Sources</h3>
          <p className="text-xs text-slate-500 mb-4">Where visitors come from</p>
          {stats && stats.trafficSources.length > 0 ? (
            <div className="h-[180px] sm:h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.trafficSources} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="source" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Visits" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-slate-600 text-sm">No source data yet</div>
          )}
        </motion.div>

        {/* Device Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card rounded-xl border border-riden-border p-4 sm:p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-1">Device Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">Visitor device types</p>
          {stats && stats.deviceBreakdown.length > 0 ? (
            <>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.deviceBreakdown} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="count">
                      {stats.deviceBreakdown.map((entry, i) => (
                        <Cell key={i} fill={DEVICE_COLORS[entry.device] ?? "#64748b"} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {stats.deviceBreakdown.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: DEVICE_COLORS[d.device] ?? "#64748b" }} />
                    <span className="text-slate-400 truncate">{d.device}</span>
                    <span className="text-white font-medium ml-auto">{d.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-slate-600 text-sm">No device data yet</div>
          )}
        </motion.div>
      </div>

      {/* Top Pages + Recent Events */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Pages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl border border-riden-border"
        >
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-riden-border">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Globe size={14} className="text-cyan-400" /> Top Pages
            </h3>
            <span className="text-xs text-slate-500">30 days</span>
          </div>
          {stats && stats.topPages.length > 0 ? (
            <div className="divide-y divide-riden-border">
              {stats.topPages.map((page, i) => {
                const max = stats.topPages[0]?.views ?? 1;
                return (
                  <div key={i} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-4 flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white truncate">{page.path}</div>
                      <div className="mt-1 h-1.5 rounded-full bg-riden-muted overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(page.views / max) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0 font-medium">{page.views.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-600 text-sm">No page data yet</div>
          )}
        </motion.div>

        {/* Recent Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card rounded-xl border border-riden-border"
        >
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-riden-border">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity size={14} className="text-violet-400" /> Recent Events
            </h3>
            <span className="text-xs text-slate-500">Live feed</span>
          </div>
          {stats && stats.recentEvents.length > 0 ? (
            <div className="divide-y divide-riden-border max-h-[300px] overflow-y-auto portal-scroll">
              {stats.recentEvents.map((event) => (
                <div key={event.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-riden-muted border border-riden-border flex items-center justify-center flex-shrink-0">
                    {event.type === "page_view" && <Eye size={11} className="text-blue-400" />}
                    {event.type === "click" && <MousePointerClick size={11} className="text-cyan-400" />}
                    {event.type === "form_submit" && <FileText size={11} className="text-amber-400" />}
                    {(event.type === "heartbeat" || !event.type) && <Activity size={11} className="text-slate-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white">{EVENT_LABELS[event.type] ?? event.type}</div>
                    <div className="text-[10px] text-slate-500 truncate">{event.path}</div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span className="text-[10px] text-slate-600">{relativeTime(event.createdAt)}</span>
                    <span className="text-[10px] text-slate-600 flex items-center gap-1">
                      {event.device === "mobile" ? <Smartphone size={9} /> : <Monitor size={9} />}
                      {event.device}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-600 text-sm">No events yet</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
