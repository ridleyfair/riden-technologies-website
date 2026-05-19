"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, Shield, Mail, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const team = [
  { id: "1", name: "Ridley Fair", email: "ridley@ridentechnologies.com", role: "owner", status: "active", avatar: "RF", gradient: "from-blue-500 to-violet-600", lastActive: "Active now" },
  { id: "2", name: "Denis Beqiraj", email: "denis@ridentechnologies.com", role: "admin", status: "active", avatar: "DB", gradient: "from-violet-500 to-cyan-500", lastActive: "Active now" },
];

const roleColors: Record<string, "default" | "violet" | "cyan" | "success" | "warning" | "secondary"> = {
  owner: "violet",
  admin: "default",
  designer: "cyan",
  developer: "success",
  sales: "warning",
  support: "secondary",
};

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Team Management</h2>
          <p className="text-sm text-slate-500">{team.filter(m => m.status === "active").length} active team members</p>
        </div>
        <Button variant="gradient" size="sm">
          <Plus size={14} />
          Invite Member
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl border border-riden-border p-5 hover:border-white/10 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${member.gradient} flex items-center justify-center text-sm font-bold text-white`}>
                  {member.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{member.name}</div>
                  <div className="text-xs text-slate-500">{member.lastActive}</div>
                </div>
              </div>
              <button className="p-1 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
                <MoreHorizontal size={14} />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Badge variant={roleColors[member.role] || "secondary"} className="capitalize">{member.role}</Badge>
              {member.status === "active"
                ? <span className="flex items-center gap-1 text-xs text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active</span>
                : <span className="flex items-center gap-1 text-xs text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> Inactive</span>
              }
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
              <Mail size={12} />
              {member.email}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs">View Profile</Button>
              <Button variant="ghost" size="sm" className="text-xs">
                <Shield size={12} />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
