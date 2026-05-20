"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Phone, Building2, Calendar, Tag, Star, ExternalLink, FolderPlus, CheckCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

// ─── Intake brief parser ───────────────────────────────────────────────────────

function parseBriefValue(message: string, key: string): string {
  const regex = new RegExp(`^${key}:\\s*(.+)$`, "mi");
  const m = message.match(regex);
  return m ? m[1].trim() : "";
}

function estimateBudget(service: string | null, message: string): number {
  const planLine = service || parseBriefValue(message, "Selected plan");
  const lower = planLine.toLowerCase();
  if (lower.includes("enterprise")) return 1000;
  if (lower.includes("pro")) return 500;
  if (lower.includes("starter")) return 150;
  // Fall back to scanning for known price mentions
  if (lower.includes("1,000") || lower.includes("1000")) return 1000;
  if (lower.includes("500")) return 500;
  if (lower.includes("150")) return 150;
  return 0;
}

function parseDueDate(message: string): string {
  const raw = parseBriefValue(message, "Deadline");
  if (!raw || raw === "None") return "";

  // Try to parse natural language into a date
  const lower = raw.toLowerCase();
  const now = new Date();

  if (lower.includes("week")) {
    const match = lower.match(/(\d+)\s*week/);
    const weeks = match ? parseInt(match[1]) : 2;
    const d = new Date(now);
    d.setDate(d.getDate() + weeks * 7);
    return d.toISOString().split("T")[0];
  }
  if (lower.includes("month")) {
    const match = lower.match(/(\d+)\s*month/);
    const months = match ? parseInt(match[1]) : 1;
    const d = new Date(now);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split("T")[0];
  }
  // If it looks like a date already
  const attempt = new Date(raw);
  if (!isNaN(attempt.getTime())) return attempt.toISOString().split("T")[0];
  // Can't parse — return empty, show the raw text as a hint
  return "";
}

// ─── Intake brief display ──────────────────────────────────────────────────────

function IntakeBrief({ text }: { text: string }) {
  if (!text.includes("=== WEBSITE INTAKE BRIEF ===")) {
    return <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{text}</p>;
  }

  const sections: { heading: string; lines: string[] }[] = [];
  let current: { heading: string; lines: string[] } | null = null;

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line === "=== WEBSITE INTAKE BRIEF ===") continue;
    const isHeading = /^[A-Z][A-Z\s&\/]+$/.test(line) && line.length < 30;
    if (isHeading) {
      if (current) sections.push(current);
      current = { heading: line, lines: [] };
    } else if (current && line) {
      current.lines.push(line);
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

// ─── Create project from lead modal ───────────────────────────────────────────

const inputCls = "w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors";

function CreateProjectModal({
  lead,
  onClose,
}: {
  lead: Lead;
  onClose: () => void;
}) {
  const deadlineRaw = parseBriefValue(lead.message, "Deadline");
  const estimatedBudget = estimateBudget(lead.service, lead.message);

  const [form, setForm] = useState({
    name: lead.company ? `${lead.company} Website` : `${lead.name} Website`,
    clientName: lead.company || lead.name,
    budget: estimatedBudget > 0 ? String(estimatedBudget) : "",
    dueDate: parseDueDate(lead.message),
    notes: [
      lead.service && `Plan: ${lead.service}`,
      deadlineRaw && deadlineRaw !== "None" && `Requested deadline: ${deadlineRaw}`,
      parseBriefValue(lead.message, "Services/products") && `Services: ${parseBriefValue(lead.message, "Services/products")}`,
      parseBriefValue(lead.message, "Style preference") && `Style: ${parseBriefValue(lead.message, "Style preference")}`,
      parseBriefValue(lead.message, "Brand colours") && `Colours: ${parseBriefValue(lead.message, "Brand colours")}`,
    ].filter(Boolean).join("\n"),
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  async function handleCreate() {
    if (!form.name.trim()) { setError("Project name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          clientName: form.clientName.trim(),
          status: "in_progress",
          budget: parseFloat(form.budget) || 0,
          spent: 0,
          progress: 0,
          dueDate: form.dueDate || null,
          notes: form.notes,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to create project.");
        return;
      }
      const project = await res.json();
      setCreatedId(project.id);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (createdId) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
          <CheckCircle size={28} className="text-emerald-400" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">Project Created</h3>
        <p className="text-sm text-slate-400 mb-5">
          <span className="text-white font-medium">{form.name}</span> is now live in your projects board.
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Stay here</Button>
          <Link href="/portal/projects">
            <Button variant="gradient" size="sm">
              View Projects <ArrowRight size={13} />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-1">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs text-slate-400 mb-1.5">Project Name</label>
          <input value={form.name} onChange={set("name")} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Client Name</label>
          <input value={form.clientName} onChange={set("clientName")} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">
            Budget (£)
            {estimatedBudget > 0 && (
              <span className="ml-1.5 text-[10px] text-blue-400">estimated from plan</span>
            )}
          </label>
          <input type="number" min="0" value={form.budget} onChange={set("budget")} placeholder="0" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">
            Due Date
            {deadlineRaw && deadlineRaw !== "None" && (
              <span className="ml-1.5 text-[10px] text-slate-500">({deadlineRaw})</span>
            )}
          </label>
          <input type="date" value={form.dueDate} onChange={set("dueDate")} className={inputCls} />
        </div>
        <div className="flex items-center gap-2 bg-riden-surface rounded-xl border border-riden-border px-3 py-2.5">
          <span className="text-xs text-slate-500">Status</span>
          <span className="ml-auto text-xs font-medium text-amber-400">In Progress</span>
        </div>
        <div className="flex items-center gap-2 bg-riden-surface rounded-xl border border-riden-border px-3 py-2.5">
          <span className="text-xs text-slate-500">Spent</span>
          <span className="ml-auto text-xs font-medium text-white">£0</span>
        </div>
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Notes (pre-filled from intake)</label>
        <textarea rows={3} value={form.notes} onChange={set("notes")} className={`${inputCls} resize-none`} />
      </div>

      {error && (
        <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="gradient" size="sm" onClick={handleCreate} disabled={saving}>
          <FolderPlus size={13} />
          {saving ? "Creating..." : "Create Project"}
        </Button>
      </div>
    </div>
  );
}

// ─── Lead detail modal ─────────────────────────────────────────────────────────

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onDelete: (lead: Lead) => void;
}

export default function LeadDetailModal({ lead, onClose, onStatusChange, onDelete }: LeadDetailModalProps) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);

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

              {/* Create project panel */}
              <AnimatePresence>
                {showCreateProject && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="bg-riden-surface rounded-xl border border-blue-500/20 p-4"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <FolderPlus size={15} className="text-blue-400" />
                      <span className="text-sm font-semibold text-white">Create Project from Lead</span>
                      <button
                        onClick={() => setShowCreateProject(false)}
                        className="ml-auto p-1 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <CreateProjectModal lead={lead} onClose={() => setShowCreateProject(false)} />
                  </motion.div>
                )}
              </AnimatePresence>

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

              {/* Intake brief */}
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
              <div className="flex items-center gap-2">
                {!showCreateProject && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateProject(true)}
                    className="gap-1.5 text-blue-400 border-blue-500/30 hover:border-blue-500/60"
                  >
                    <FolderPlus size={13} />
                    Create Project
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
