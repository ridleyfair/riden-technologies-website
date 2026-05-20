"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Phone, Building2, Calendar, Tag, Star, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company: string | null;
  service: string | null;
  message: string;
  notes?: string | null;
  status: string;
  source: string;
  score: number;
  value?: number | null;
  createdAt: string;
};

const statusOptions = ["new", "contacted", "qualified", "proposal", "won", "lost"];

const statusColors: Record<string, "default" | "violet" | "cyan" | "warning" | "success" | "destructive" | "secondary"> = {
  new: "default",
  contacted: "violet",
  qualified: "cyan",
  proposal: "warning",
  won: "success",
  lost: "destructive",
};

function IntakeBrief({ text }: { text: string }) {
  // Detect structured intake brief format
  if (!text.includes("=== WEBSITE INTAKE BRIEF ===")) {
    return (
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{text}</p>
    );
  }

  // Parse sections from the brief
  const sections: { heading: string; lines: string[] }[] = [];
  let current: { heading: string; lines: string[] } | null = null;

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line === "=== WEBSITE INTAKE BRIEF ===") continue;

    const isHeading = /^[A-Z][A-Z\s&\/]+$/.test(line) && line.length < 30;
    if (isHeading) {
      if (current) sections.push(current);
      current = { heading: line, lines: [] };
    } else if (current) {
      if (line) current.lines.push(line);
    }
  }
  if (current) sections.push(current);

  if (sections.length === 0) {
    return <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{text}</p>;
  }

  return (
    <div className="space-y-4">
      {sections.map((s) => (
        <div key={s.heading}>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{s.heading}</div>
          <div className="space-y-1">
            {s.lines.map((line, i) => {
              const colonIdx = line.indexOf(":");
              if (colonIdx > 0 && colonIdx < 30) {
                const key = line.slice(0, colonIdx).trim();
                const val = line.slice(colonIdx + 1).trim();
                return (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="text-slate-500 flex-shrink-0 min-w-[120px]">{key}</span>
                    <span className="text-slate-200">{val || "—"}</span>
                  </div>
                );
              }
              return <p key={i} className="text-sm text-slate-300">{line}</p>;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onDelete: (lead: Lead) => void;
}

export default function LeadDetailModal({ lead, onClose, onStatusChange, onDelete }: LeadDetailModalProps) {
  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (!lead) return null;

  const handleStatusChange = async (status: string) => {
    setUpdatingStatus(true);
    await onStatusChange(lead.id, status);
    setUpdatingStatus(false);
  };

  const initials = lead.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <AnimatePresence>
      {lead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl glass-card rounded-2xl border border-riden-border flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-4 px-5 py-4 border-b border-riden-border flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-white truncate">{lead.name}</h2>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <a href={`mailto:${lead.email}`} className="text-xs text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1">
                    <Mail size={11} />{lead.email}
                  </a>
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} className="text-xs text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1">
                      <Phone size={11} />{lead.phone}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={statusColors[lead.status] ?? "secondary"} className="capitalize">
                  {lead.status}
                </Badge>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Body — scrollable */}
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {/* Key details row */}
              <div className="grid grid-cols-2 gap-3">
                {lead.company && (
                  <div className="flex items-center gap-2.5 bg-riden-surface rounded-xl p-3 border border-riden-border">
                    <Building2 size={14} className="text-slate-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500">Company</div>
                      <div className="text-sm text-white truncate">{lead.company}</div>
                    </div>
                  </div>
                )}
                {lead.service && (
                  <div className="flex items-center gap-2.5 bg-riden-surface rounded-xl p-3 border border-riden-border">
                    <Tag size={14} className="text-slate-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500">Plan / Service</div>
                      <div className="text-sm text-white truncate">{lead.service}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2.5 bg-riden-surface rounded-xl p-3 border border-riden-border">
                  <Calendar size={14} className="text-slate-500 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500">Submitted</div>
                    <div className="text-sm text-white">
                      {new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-riden-surface rounded-xl p-3 border border-riden-border">
                  <ExternalLink size={14} className="text-slate-500 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500">Source</div>
                    <div className="text-sm text-white capitalize">{lead.source}</div>
                  </div>
                </div>
                {(lead.score ?? 0) > 0 && (
                  <div className="flex items-center gap-2.5 bg-riden-surface rounded-xl p-3 border border-riden-border">
                    <Star size={14} className="text-amber-400 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500">Lead Score</div>
                      <div className="text-sm text-white">{lead.score}</div>
                    </div>
                  </div>
                )}
                {(lead.value ?? 0) > 0 && (
                  <div className="flex items-center gap-2.5 bg-riden-surface rounded-xl p-3 border border-riden-border">
                    <div className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400 font-bold text-xs flex items-center justify-center">£</div>
                    <div>
                      <div className="text-[10px] text-slate-500">Deal Value</div>
                      <div className="text-sm text-white">£{lead.value}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Intake brief / message */}
              {lead.message && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Website Intake Brief</div>
                  <div className="bg-riden-surface rounded-xl border border-riden-border p-4">
                    <IntakeBrief text={lead.message} />
                  </div>
                </div>
              )}

              {/* Notes */}
              {lead.notes && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Notes</div>
                  <div className="bg-riden-surface rounded-xl border border-riden-border p-4">
                    <p className="text-sm text-slate-300 leading-relaxed">{lead.notes}</p>
                  </div>
                </div>
              )}

              {/* Update status */}
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Update Status</div>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((s) => (
                    <button
                      key={s}
                      disabled={updatingStatus || lead.status === s}
                      onClick={() => handleStatusChange(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize disabled:cursor-not-allowed ${
                        lead.status === s
                          ? "bg-blue-600/20 border border-blue-500/40 text-blue-300"
                          : "bg-riden-muted border border-riden-border text-slate-400 hover:text-white hover:border-slate-500"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-riden-border flex-shrink-0">
              <button
                onClick={() => { onDelete(lead); onClose(); }}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Delete lead
              </button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
