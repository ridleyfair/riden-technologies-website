"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Users, DollarSign, Globe, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockClients } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

const tierBadge: Record<string, "default" | "violet" | "cyan"> = {
  starter: "default",
  growth: "violet",
  enterprise: "cyan",
};

export default function ClientsView() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");

  const filtered = mockClients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === "all" || c.tier === tierFilter;
    return matchSearch && matchTier;
  });

  const totalRevenue = mockClients.reduce((s, c) => s + c.revenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Client Management</h2>
          <p className="text-sm text-slate-500">{mockClients.filter(c => c.status === "active").length} active clients</p>
        </div>
        <Button variant="gradient" size="sm">
          <Plus size={14} />
          Add Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Clients", value: mockClients.length, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Active", value: mockClients.filter(c => c.status === "active").length, icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: DollarSign, color: "text-violet-400", bg: "bg-violet-500/10" },
          { label: "Websites Managed", value: mockClients.reduce((s, c) => s + c.websites, 0), icon: Globe, color: "text-cyan-400", bg: "bg-cyan-500/10" },
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
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-riden-muted border border-riden-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        {["all", "starter", "growth", "enterprise"].map((t) => (
          <button
            key={t}
            onClick={() => setTierFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              tierFilter === t
                ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                : "text-slate-500 hover:text-white hover:bg-riden-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Client Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((client, i) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl border border-riden-border p-5 hover:border-white/10 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white">
                  {client.company[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{client.company}</div>
                  <div className="text-xs text-slate-500">{client.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={tierBadge[client.tier]} className="capitalize text-[10px]">
                  {client.tier}
                </Badge>
                <button className="p-1 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2 bg-riden-surface rounded-lg border border-riden-border">
                <div className="text-sm font-bold text-white">{formatCurrency(client.revenue)}</div>
                <div className="text-[10px] text-slate-500">Revenue</div>
              </div>
              <div className="text-center p-2 bg-riden-surface rounded-lg border border-riden-border">
                <div className="text-sm font-bold text-white">{client.websites}</div>
                <div className="text-[10px] text-slate-500">Sites</div>
              </div>
              <div className="text-center p-2 bg-riden-surface rounded-lg border border-riden-border">
                <div className={`text-sm font-bold capitalize ${client.status === "active" ? "text-emerald-400" : "text-slate-400"}`}>
                  {client.status}
                </div>
                <div className="text-[10px] text-slate-500">Status</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">{client.email}</div>
              <div className="flex gap-1">
                {client.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-riden-muted border border-riden-border text-slate-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
