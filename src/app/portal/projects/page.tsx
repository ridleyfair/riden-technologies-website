"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockProjects } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string }> = {
  planning: { label: "Planning", color: "text-blue-400" },
  in_progress: { label: "In Progress", color: "text-amber-400" },
  review: { label: "Review", color: "text-violet-400" },
  completed: { label: "Completed", color: "text-emerald-400" },
  paused: { label: "Paused", color: "text-slate-400" },
};

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Projects</h2>
          <p className="text-sm text-slate-500">{mockProjects.length} active projects</p>
        </div>
        <Button variant="gradient" size="sm">
          <Plus size={14} />
          New Project
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {mockProjects.map((project, i) => {
          const status = statusConfig[project.status];
          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl border border-riden-border p-5 hover:border-white/10 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-white mb-1">{project.name}</div>
                  <div className="text-xs text-slate-500">{project.clientName}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                  <button className="p-1 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>Progress</span>
                  <span className="text-white font-medium">{project.progress}%</span>
                </div>
                <div className="h-1.5 bg-riden-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${project.progress}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-riden-surface rounded-lg border border-riden-border">
                  <div className="text-xs font-bold text-white">{formatCurrency(project.budget)}</div>
                  <div className="text-[10px] text-slate-500">Budget</div>
                </div>
                <div className="text-center p-2 bg-riden-surface rounded-lg border border-riden-border">
                  <div className="text-xs font-bold text-white">{formatCurrency(project.spent)}</div>
                  <div className="text-[10px] text-slate-500">Spent</div>
                </div>
                <div className="text-center p-2 bg-riden-surface rounded-lg border border-riden-border">
                  <div className="text-xs font-bold text-white">{formatDate(project.dueDate)}</div>
                  <div className="text-[10px] text-slate-500">Due</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
