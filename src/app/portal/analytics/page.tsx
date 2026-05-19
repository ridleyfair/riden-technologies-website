"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from "recharts";
import { revenueChartData } from "@/lib/mock-data";

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#0D1117",
    border: "1px solid #1E2A3B",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "12px",
  },
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Analytics</h2>
        <p className="text-sm text-slate-500">Performance overview — last 6 months</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: "$84,200", change: "+23%", color: "text-emerald-400" },
          { label: "Conversion Rate", value: "18.4%", change: "+4.2%", color: "text-blue-400" },
          { label: "Avg Deal Value", value: "$6,150", change: "+12%", color: "text-violet-400" },
          { label: "CAC", value: "$340", change: "-8%", color: "text-cyan-400" },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl border border-riden-border p-5"
          >
            <div className="text-xs text-slate-500 mb-2">{kpi.label}</div>
            <div className="text-2xl font-bold text-white mb-1">{kpi.value}</div>
            <div className={`text-xs font-medium ${kpi.color}`}>{kpi.change} vs last period</div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl border border-riden-border p-5"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-white">Revenue & Lead Growth</h3>
            <p className="text-xs text-slate-500">Monthly performance overview</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={revenueChartData}>
            <defs>
              <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#gradRevenue)" name="Revenue ($)" />
            <Area type="monotone" dataKey="leads" stroke="#8B5CF6" strokeWidth={2} fill="url(#gradLeads)" name="New Leads" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Two Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl border border-riden-border p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-1">Client Growth</h3>
          <p className="text-xs text-slate-500 mb-6">New clients per month</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="clients" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Clients" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card rounded-xl border border-riden-border p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-1">Lead Velocity</h3>
          <p className="text-xs text-slate-500 mb-6">Leads generated per month</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="leads" stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981", strokeWidth: 0, r: 4 }} name="Leads" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
