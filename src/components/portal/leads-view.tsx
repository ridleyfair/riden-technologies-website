"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Plus,
  TrendingUp,
  UserPlus,
  Star,
  MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockLeads } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import type { LeadStatus } from "@/types";

const statusColors: Record<LeadStatus, string> = {
  new: "default",
  contacted: "violet",
  qualified: "cyan",
  proposal: "warning",
  negotiation: "warning",
  won: "success",
  lost: "destructive",
} as const;

export default function LeadsView() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");

  const filtered = mockLeads.filter((lead) => {
    const matchSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.company?.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Lead Management</h2>
          <p className="text-sm text-slate-500">{mockLeads.length} total leads in pipeline</p>
        </div>
        <Button variant="gradient" size="sm">
          <Plus size={14} />
          Add Lead
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: mockLeads.length, icon: UserPlus, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Hot Leads", value: mockLeads.filter(l => l.score >= 80).length, icon: Star, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Pipeline Value", value: formatCurrency(mockLeads.reduce((s, l) => s + l.value, 0)), icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Won This Month", value: mockLeads.filter(l => l.status === "won").length, icon: Star, color: "text-violet-400", bg: "bg-violet-500/10" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl border border-riden-border p-4 flex items-center gap-4"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon size={18} className={stat.color} />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-riden-muted border border-riden-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {["all", "new", "qualified", "proposal", "won"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as LeadStatus | "all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                  : "text-slate-500 hover:text-white hover:bg-riden-muted"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <Button variant="outline" size="sm">
          <Filter size={14} />
          Filter
        </Button>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl border border-riden-border overflow-hidden"
      >
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-riden-border bg-riden-surface/50 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <div className="col-span-3">Name</div>
          <div className="col-span-2">Company</div>
          <div className="col-span-1">Score</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Source</div>
          <div className="col-span-2">Value</div>
          <div className="col-span-1"></div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-riden-border">
          {filtered.map((lead) => (
            <div
              key={lead.id}
              className="grid grid-cols-12 gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer items-center"
            >
              <div className="col-span-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {lead.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{lead.name}</div>
                  <div className="text-xs text-slate-500 truncate">{lead.email}</div>
                </div>
              </div>
              <div className="col-span-2 text-sm text-slate-400 truncate">{lead.company || "—"}</div>
              <div className="col-span-1">
                <div className="flex items-center gap-1">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500"
                    style={{ width: `${lead.score}%`, maxWidth: "40px" }}
                  />
                  <span className="text-xs text-slate-400">{lead.score}</span>
                </div>
              </div>
              <div className="col-span-2">
                <Badge variant={statusColors[lead.status] as "default" | "violet" | "cyan" | "warning" | "success" | "destructive"} className="capitalize">
                  {lead.status}
                </Badge>
              </div>
              <div className="col-span-1 text-xs text-slate-500 capitalize">{lead.source}</div>
              <div className="col-span-2 text-sm font-medium text-white">{formatCurrency(lead.value)}</div>
              <div className="col-span-1 flex justify-end">
                <button className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-sm">
            No leads found matching your filters.
          </div>
        )}
      </motion.div>
    </div>
  );
}
