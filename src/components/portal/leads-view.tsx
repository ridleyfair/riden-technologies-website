"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Plus, TrendingUp, UserPlus, Star, MoreHorizontal, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Lead = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  service: string | null;
  message: string;
  status: string;
  source: string;
  score: number;
  createdAt: string;
};

const statusColors: Record<string, "default" | "violet" | "cyan" | "warning" | "success" | "destructive" | "secondary"> = {
  new: "default",
  contacted: "violet",
  qualified: "cyan",
  proposal: "warning",
  won: "success",
  lost: "destructive",
};

const statusOptions = ["all", "new", "contacted", "qualified", "proposal", "won", "lost"];

export default function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchLeads();
    setUpdatingId(null);
  };

  const filtered = leads.filter((lead) => {
    const matchSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      (lead.company?.toLowerCase() ?? "").includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const hotLeads = leads.filter((l) => l.score >= 70).length;
  const wonLeads = leads.filter((l) => l.status === "won").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">Lead Management</h2>
          <p className="text-xs sm:text-sm text-slate-500">{leads.length} total leads in pipeline</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={fetchLeads}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="gradient" size="sm">
            <Plus size={14} />
            <span className="hidden sm:inline">Add Lead</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total Leads", value: leads.length, icon: UserPlus, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Hot Leads", value: hotLeads, icon: Star, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "New This Week", value: leads.filter(l => {
            const d = new Date(l.createdAt);
            const now = new Date();
            return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
          }).length, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Won", value: wonLeads, icon: Star, color: "text-violet-400", bg: "bg-violet-500/10" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl border border-riden-border p-3 sm:p-4 flex items-center gap-3 sm:gap-4"
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
              <stat.icon size={16} className={stat.color} />
            </div>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-bold text-white">{stat.value}</div>
              <div className="text-[10px] sm:text-xs text-slate-500 leading-tight">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-riden-muted border border-riden-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 flex-nowrap sm:flex-wrap scrollbar-hide">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                statusFilter === s
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                  : "text-slate-500 hover:text-white hover:bg-riden-muted"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <Button variant="outline" size="sm" className="flex-shrink-0">
            <Filter size={14} />
            <span className="hidden sm:inline">Filter</span>
          </Button>
        </div>
      </div>

      {/* Table — desktop only */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl border border-riden-border overflow-hidden hidden md:block"
      >
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-riden-border bg-riden-surface/50 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <div className="col-span-3">Name</div>
          <div className="col-span-2">Company</div>
          <div className="col-span-2">Service</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Source</div>
          <div className="col-span-1">Date</div>
          <div className="col-span-1"></div>
        </div>

        <div className="divide-y divide-riden-border">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm">Loading leads...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              {leads.length === 0
                ? "No leads yet. Submit the contact form to see them appear here."
                : "No leads match your filters."}
            </div>
          ) : (
            filtered.map((lead) => (
              <div
                key={lead.id}
                className="grid grid-cols-12 gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors items-center"
              >
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {lead.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{lead.name}</div>
                    <div className="text-xs text-slate-500 truncate">{lead.email}</div>
                  </div>
                </div>
                <div className="col-span-2 text-sm text-slate-400 truncate">{lead.company || "—"}</div>
                <div className="col-span-2 text-xs text-slate-400 truncate">{lead.service || "—"}</div>
                <div className="col-span-2">
                  <select
                    value={lead.status}
                    disabled={updatingId === lead.id}
                    onChange={(e) => updateStatus(lead.id, e.target.value)}
                    className="bg-transparent border-none text-xs cursor-pointer focus:outline-none"
                  >
                    {statusOptions.slice(1).map((s) => (
                      <option key={s} value={s} className="bg-riden-surface">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                  <Badge variant={statusColors[lead.status] ?? "secondary"} className="capitalize pointer-events-none">
                    {lead.status}
                  </Badge>
                </div>
                <div className="col-span-1 text-xs text-slate-500 capitalize">{lead.source}</div>
                <div className="col-span-1 text-xs text-slate-500">
                  {new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </div>
                <div className="col-span-1 flex justify-end">
                  <button className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Card list — mobile only */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="md:hidden glass-card rounded-xl border border-riden-border overflow-hidden"
      >
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Loading leads...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            {leads.length === 0
              ? "No leads yet. Submit the contact form to see them appear here."
              : "No leads match your filters."}
          </div>
        ) : (
          <div className="divide-y divide-riden-border">
            {filtered.map((lead) => (
              <div key={lead.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {lead.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{lead.name}</div>
                      <div className="text-xs text-slate-500 truncate">{lead.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={statusColors[lead.status] ?? "secondary"} className="capitalize text-[10px]">
                      {lead.status}
                    </Badge>
                    <button className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3">
                  <div>
                    <span className="text-slate-600">Company</span>
                    <div className="text-slate-300 truncate">{lead.company || "—"}</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Service</span>
                    <div className="text-slate-300 truncate">{lead.service || "—"}</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Source</span>
                    <div className="text-slate-300 capitalize">{lead.source}</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Date</span>
                    <div className="text-slate-300">
                      {new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Update status:</span>
                  <select
                    value={lead.status}
                    disabled={updatingId === lead.id}
                    onChange={(e) => updateStatus(lead.id, e.target.value)}
                    className="flex-1 bg-riden-muted border border-riden-border rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 transition-colors min-h-[36px]"
                  >
                    {statusOptions.slice(1).map((s) => (
                      <option key={s} value={s} className="bg-riden-surface">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
