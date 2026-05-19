"use client";

import React from "react";
import { motion } from "framer-motion";
import { Play, Pause, Plus, Activity, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockAutomations } from "@/lib/mock-data";

export default function AutomationView() {
  const activeCount = mockAutomations.filter(a => a.status === "active").length;
  const totalRuns = mockAutomations.reduce((s, a) => s + a.runsTotal, 0);
  const todayRuns = mockAutomations.reduce((s, a) => s + a.runsToday, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Automation System</h2>
          <p className="text-sm text-slate-500">{activeCount} active automations running</p>
        </div>
        <Button variant="gradient" size="sm">
          <Plus size={14} />
          New Automation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Flows", value: activeCount, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Total Runs", value: totalRuns.toLocaleString(), color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Runs Today", value: todayRuns, color: "text-violet-400", bg: "bg-violet-500/10" },
          { label: "Success Rate", value: "99.2%", color: "text-cyan-400", bg: "bg-cyan-500/10" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl border border-riden-border p-4"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <Activity size={18} className={stat.color} />
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Automation List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl border border-riden-border overflow-hidden"
      >
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-riden-border bg-riden-surface/50 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <div className="col-span-1">Status</div>
          <div className="col-span-3">Name</div>
          <div className="col-span-2">Trigger</div>
          <div className="col-span-1">Actions</div>
          <div className="col-span-2">Total Runs</div>
          <div className="col-span-2">Today</div>
          <div className="col-span-1"></div>
        </div>

        <div className="divide-y divide-riden-border">
          {mockAutomations.map((auto, i) => (
            <motion.div
              key={auto.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors items-center"
            >
              <div className="col-span-1">
                <div className={`w-2.5 h-2.5 rounded-full ${auto.status === "active" ? "bg-emerald-400 animate-pulse" : auto.status === "paused" ? "bg-amber-400" : "bg-slate-600"}`} />
              </div>
              <div className="col-span-3">
                <div className="text-sm font-medium text-white">{auto.name}</div>
                <div className="text-xs text-slate-500">{auto.actions} actions in sequence</div>
              </div>
              <div className="col-span-2">
                <Badge variant="secondary" className="text-[10px]">{auto.trigger}</Badge>
              </div>
              <div className="col-span-1 text-sm text-slate-400">{auto.actions}</div>
              <div className="col-span-2 text-sm text-white">{auto.runsTotal.toLocaleString()}</div>
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white">{auto.runsToday}</span>
                  {auto.runsToday > 0 && (
                    <div className="h-1.5 w-16 bg-riden-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min((auto.runsToday / 10) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="col-span-1 flex justify-end gap-1">
                <button className="p-1.5 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
                  {auto.status === "active" ? <Pause size={13} /> : <Play size={13} />}
                </button>
                <button className="p-1.5 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
                  <MoreHorizontal size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Templates */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-4">Quick Templates</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: "Lead Nurture Sequence", desc: "5-email automated follow-up for new leads", trigger: "Lead Created", icon: "📧" },
            { name: "Onboarding Flow", desc: "Welcome new clients with tasks and resources", trigger: "Deal Won", icon: "🚀" },
            { name: "Re-Engagement Campaign", desc: "Win back inactive leads after 30 days", trigger: "Lead Inactive", icon: "🔄" },
          ].map((template, i) => (
            <div
              key={i}
              className="glass-card rounded-xl border border-riden-border p-5 hover:border-blue-500/30 transition-all cursor-pointer group"
            >
              <div className="text-2xl mb-3">{template.icon}</div>
              <div className="text-sm font-semibold text-white mb-1">{template.name}</div>
              <div className="text-xs text-slate-400 mb-3">{template.desc}</div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px]">{template.trigger}</Badge>
                <Button variant="ghost" size="sm" className="text-xs group-hover:text-blue-400">
                  Use Template
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
