"use client";

import React from "react";
import { motion } from "framer-motion";
import { Globe, Plus, ExternalLink, RefreshCw, Eye, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const websites = [
  { id: "1", name: "RetailEdge Store", client: "RetailEdge Inc.", url: "retailedge.com", status: "live", tier: "growth", template: "E-Commerce Pro", generated: "2026-03-15", views: "4,281" },
  { id: "2", name: "CloudScale Landing", client: "CloudScale SaaS", url: "cloudscale.io", status: "live", tier: "enterprise", template: "SaaS Premium", generated: "2025-11-10", views: "12,847" },
  { id: "3", name: "Sunrise Bakery", client: "Sunrise Bakery", url: "sunrisebakery.com", status: "live", tier: "starter", template: "Local Business", generated: "2026-01-22", views: "892" },
  { id: "4", name: "Kim Law Group Site", client: "Kim Law Group", url: "kimlawgroup.com", status: "building", tier: "growth", template: "Professional Services", generated: "2026-05-10", views: "—" },
  { id: "5", name: "FitPro Studios", client: "FitPro Studios", url: "fitprostudios.com", status: "live", tier: "starter", template: "Health & Fitness", generated: "2026-02-08", views: "1,432" },
];

const statusVariant: Record<string, "success" | "warning" | "secondary"> = {
  live: "success",
  building: "warning",
  draft: "secondary",
};

export default function WebsitesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Website Management</h2>
          <p className="text-sm text-slate-500">{websites.filter(w => w.status === "live").length} websites live</p>
        </div>
        <Button variant="gradient" size="sm">
          <Plus size={14} />
          Generate Website
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Websites", value: websites.length },
          { label: "Live", value: websites.filter(w => w.status === "live").length },
          { label: "Building", value: websites.filter(w => w.status === "building").length },
          { label: "Total Views", value: "19,452" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl border border-riden-border p-4 text-center"
          >
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Website Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {websites.map((site, i) => (
          <motion.div
            key={site.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl border border-riden-border overflow-hidden hover:border-white/10 transition-all group"
          >
            {/* Preview */}
            <div className="h-32 bg-gradient-to-br from-blue-600/20 via-riden-surface to-violet-600/20 relative flex items-center justify-center border-b border-riden-border">
              <Globe size={32} className="text-blue-400/30" />
              <div className="absolute top-3 right-3">
                <Badge variant={statusVariant[site.status]} className="text-[10px] capitalize">{site.status}</Badge>
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold text-white">{site.name}</div>
                  <div className="text-xs text-slate-500">{site.client}</div>
                </div>
                <button className="p-1 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
                  <MoreHorizontal size={14} />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <ExternalLink size={12} className="text-slate-600" />
                <span className="text-xs text-blue-400 font-mono">{site.url}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                <span>Template: {site.template}</span>
                <span className="flex items-center gap-1">
                  <Eye size={11} /> {site.views}
                </span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs">
                  <Eye size={12} /> Preview
                </Button>
                <Button variant="ghost" size="sm" className="text-xs">
                  <RefreshCw size={12} />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Generate New */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: websites.length * 0.08 }}
          className="glass-card rounded-xl border border-dashed border-riden-border p-5 flex flex-col items-center justify-center gap-3 hover:border-blue-500/30 transition-all cursor-pointer group min-h-[240px]"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
            <Plus size={22} className="text-blue-400" />
          </div>
          <div className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">
            Generate New Website
          </div>
          <div className="text-xs text-slate-600 text-center">
            AI-powered generation in minutes
          </div>
        </motion.div>
      </div>
    </div>
  );
}
