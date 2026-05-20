"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, MoreHorizontal, RefreshCw, FolderOpen, X,
  AlertTriangle, CheckCircle, Trash2, Eye, Users,
  Calendar, PoundSterling, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

type Project = {
  id: string;
  name: string;
  clientName: string;
  status: string;
  budget: number;
  spent: number;
  progress: number;
  dueDate: string | null;
  notes: string | null;
  completedAt?: string | null;
  createdAt: string;
};

type Toast = { msg: string; type: "success" | "error" };

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  planning:    { label: "Planning",     color: "text-blue-400",    bg: "bg-blue-400" },
  in_progress: { label: "In Progress",  color: "text-amber-400",   bg: "bg-amber-400" },
  review:      { label: "In Review",    color: "text-violet-400",  bg: "bg-violet-400" },
  completed:   { label: "Completed",    color: "text-emerald-400", bg: "bg-emerald-400" },
  paused:      { label: "Paused",       color: "text-slate-400",   bg: "bg-slate-400" },
};

const STATUS_OPTIONS = ["planning", "in_progress", "review", "completed", "paused"];

const inputCls =
  "w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors";

function inferMonthlyRate(notes: string | null): number {
  const text = (notes ?? "").toLowerCase();
  if (text.includes("enterprise") || text.includes("1,000") || text.includes("1000")) return 100;
  if (text.includes("pro+") || text.includes("pro ") || text.includes("500")) return 50;
  return 25;
}

// ─── Project Detail Modal ─────────────────────────────────────────────────────

function ProjectDetailModal({
  project: initialProject,
  onClose,
  onUpdate,
  onDelete,
}: {
  project: Project;
  onClose: () => void;
  onUpdate: (updated: Project) => void;
  onDelete: (project: Project) => void;
}) {
  const [project, setProject] = useState(initialProject);
  const [editing, setEditing] = useState({ spent: String(initialProject.spent), progress: String(initialProject.progress), notes: initialProject.notes ?? "" });
  const [saving, setSaving] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  const profit = Number(project.budget) - Number(project.spent);
  const monthlyRate = inferMonthlyRate(project.notes);
  const cfg = STATUS_CONFIG[project.status] ?? { label: project.status, color: "text-slate-400", bg: "bg-slate-400" };

  async function saveChanges() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spent: parseFloat(editing.spent) || 0,
          progress: parseInt(editing.progress) || 0,
          notes: editing.notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      const updated = data.project ?? data;
      setProject(updated);
      onUpdate(updated);
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(status: string) {
    if (status === "completed") { setConfirmComplete(true); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const updated = data.project ?? data;
      setProject(updated);
      onUpdate(updated);
    } catch {
      setError("Failed to update status.");
    } finally {
      setSaving(false);
    }
  }

  async function completeProject() {
    setCompleting(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          spent: parseFloat(editing.spent) || project.spent,
          progress: 100,
          notes: editing.notes || project.notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to complete project");
      const data = await res.json();
      const updated = data.project ?? data;
      setProject({ ...updated, progress: 100 });
      setEditing((e) => ({ ...e, progress: "100" }));
      onUpdate({ ...updated, progress: 100 });
      setConfirmComplete(false);
      setCompleted(true);
    } catch {
      setError("Failed to complete project.");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg glass-card rounded-2xl border border-riden-border flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-riden-border flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-white truncate">{project.name}</h2>
              <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{project.clientName || "No client"}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors flex-shrink-0">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Completed success banner */}
          {completed && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4"
            >
              <CheckCircle size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">Project completed!</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  <span className="text-white">{project.clientName}</span> is now active in your clients tab
                  with <span className="text-emerald-400">£{monthlyRate}/month</span> recurring revenue.
                </p>
                <Link href="/portal/clients" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors">
                  <Users size={11} /> View in Clients
                </Link>
              </div>
            </motion.div>
          )}

          {/* Complete confirmation */}
          <AnimatePresence>
            {confirmComplete && !completed && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-riden-surface border border-emerald-500/20 rounded-xl p-4 space-y-3"
              >
                <p className="text-sm font-semibold text-white">Complete this project?</p>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-400" /> Mark project as completed</li>
                  <li className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-400" /> Activate <span className="text-white font-medium">{project.clientName}</span> as a client</li>
                  <li className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-400" /> Set <span className="text-emerald-400 font-medium">£{monthlyRate}/month</span> recurring revenue</li>
                  <li className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-400" /> Record <span className="text-white font-medium">£{Math.max(0, Number(project.budget) - (parseFloat(editing.spent) || Number(project.spent))).toFixed(0)}</span> project profit</li>
                </ul>
                {error && <p className="text-xs text-rose-400">{error}</p>}
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setConfirmComplete(false)} disabled={completing}>Cancel</Button>
                  <Button variant="gradient" size="sm" onClick={completeProject} disabled={completing}>
                    {completing ? "Completing..." : "Confirm & Complete"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Key stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-riden-surface rounded-xl border border-riden-border p-3 text-center">
              <div className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1"><PoundSterling size={10} /> Budget</div>
              <div className="text-sm font-bold text-white">{formatCurrency(Number(project.budget))}</div>
            </div>
            <div className="bg-riden-surface rounded-xl border border-riden-border p-3 text-center">
              <div className="text-xs text-slate-500 mb-1">Spent</div>
              <div className={`text-sm font-bold ${Number(editing.spent) > Number(project.budget) ? "text-red-400" : "text-white"}`}>
                {formatCurrency(parseFloat(editing.spent) || 0)}
              </div>
            </div>
            <div className="bg-riden-surface rounded-xl border border-riden-border p-3 text-center">
              <div className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1"><TrendingUp size={10} /> Profit</div>
              <div className={`text-sm font-bold ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatCurrency(Number(project.budget) - (parseFloat(editing.spent) || Number(project.spent)))}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Progress</span>
              <span className="text-white font-medium">{editing.progress}%</span>
            </div>
            <input
              type="range" min="0" max="100"
              value={editing.progress}
              onChange={(e) => setEditing((p) => ({ ...p, progress: e.target.value }))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Spent (£)</label>
              <input type="number" min="0" value={editing.spent}
                onChange={(e) => setEditing((p) => ({ ...p, spent: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Due Date</label>
              <div className="flex items-center gap-2 bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5">
                <Calendar size={13} className="text-slate-500 flex-shrink-0" />
                <span className="text-sm text-white">{project.dueDate ? formatDate(project.dueDate) : "—"}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
            <textarea rows={3} value={editing.notes}
              onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value }))}
              className={`${inputCls} resize-none`} />
          </div>

          {/* Status */}
          <div>
            <div className="text-xs text-slate-500 mb-2">Update Status</div>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  disabled={saving || project.status === s}
                  onClick={() => changeStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:cursor-not-allowed ${
                    project.status === s
                      ? `${STATUS_CONFIG[s]?.color ?? "text-white"} border border-current/30 bg-current/10`
                      : "bg-riden-muted border border-riden-border text-slate-400 hover:text-white"
                  }`}
                >
                  {STATUS_CONFIG[s]?.label ?? s}
                </button>
              ))}
            </div>
          </div>

          {error && !confirmComplete && (
            <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-riden-border flex-shrink-0">
          <button
            onClick={() => { onDelete(project); onClose(); }}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Delete project
          </button>
          <div className="flex items-center gap-2">
            {project.status !== "completed" && !confirmComplete && !completed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmComplete(true)}
                className="text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 gap-1.5"
              >
                <CheckCircle size={13} /> Complete
              </Button>
            )}
            <Button variant="gradient" size="sm" onClick={saveChanges} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── New Project Modal ─────────────────────────────────────────────────────────

function NewProjectModal({
  open, onClose, onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
}) {
  const [form, setForm] = useState({
    name: "", clientName: "", status: "planning",
    budget: "", spent: "", progress: "0", dueDate: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({ name: "", clientName: "", status: "planning", budget: "", spent: "", progress: "0", dueDate: "", notes: "" });
      setError("");
    }
  }, [open]);

  async function handleSave() {
    if (!form.name.trim()) { setError("Project name is required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(), clientName: form.clientName.trim(),
          status: form.status,
          budget: form.budget ? Number(form.budget) : 0,
          spent: form.spent ? Number(form.spent) : 0,
          progress: form.progress ? Number(form.progress) : 0,
          dueDate: form.dueDate || null, notes: form.notes.trim(),
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to save project."); return; }
      onSave(await res.json());
      onClose();
    } catch { setError("Network error. Please try again."); }
    finally { setSaving(false); }
  }

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }} transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg glass-card rounded-2xl border border-riden-border max-h-[90vh] overflow-y-auto portal-scroll"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-riden-border sticky top-0 bg-riden-surface z-10">
              <h2 className="text-base font-semibold text-white">New Project</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Project Name *</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Acme Corp Website" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Client Name</label>
                  <input value={form.clientName} onChange={(e) => set("clientName", e.target.value)} placeholder="Acme Corp" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="bg-riden-surface">{STATUS_CONFIG[s]?.label ?? s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Budget (£)</label>
                  <input type="number" min="0" value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="500" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Spent (£)</label>
                  <input type="number" min="0" value={form.spent} onChange={(e) => set("spent", e.target.value)} placeholder="0" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Progress ({form.progress}%)</label>
                  <input type="range" min="0" max="100" value={form.progress} onChange={(e) => set("progress", e.target.value)} className="w-full accent-blue-500 mt-1" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} className={inputCls + " [color-scheme:dark]"} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional notes..." rows={3} className={inputCls + " resize-none"} />
              </div>
              {error && <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-riden-border sticky bottom-0 bg-riden-surface">
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button variant="gradient" size="sm" onClick={handleSave} disabled={saving}>{saving ? "Creating..." : "Create Project"}</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteProjectModal({ project, onConfirm, onCancel, loading }: {
  project: Project; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }} transition={{ duration: 0.18 }}
        className="relative w-full max-w-sm glass-card rounded-2xl border border-riden-border p-6"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Delete Project</h3>
            <p className="text-xs text-slate-500">This cannot be undone</p>
          </div>
          <button onClick={onCancel} className="ml-auto p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors"><X size={14} /></button>
        </div>
        <p className="text-sm text-slate-300 mb-6">
          Delete <span className="text-white font-medium">{project.name}</span>? This will permanently remove it.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 transition-colors disabled:opacity-50">
            {loading ? "Deleting..." : "Delete Project"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (msg: string, type: Toast["type"]) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProjects = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch { setError("Failed to load projects."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  useEffect(() => {
    if (!menuOpenId) return;
    const handler = () => setMenuOpenId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuOpenId]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showToast(`${deleteTarget.name} was deleted.`, "success");
    } catch { showToast("Failed to delete project.", "error"); }
    finally { setDeleting(false); setDeleteTarget(null); }
  }

  const activeCount = projects.filter((p) => p.status === "in_progress").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium ${
              toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
            {toast.type === "success" ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteProjectModal project={deleteTarget} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailProject && (
          <ProjectDetailModal
            project={detailProject}
            onClose={() => setDetailProject(null)}
            onUpdate={(updated) => {
              setProjects((prev) => prev.map((p) => p.id === updated.id ? updated : p));
              setDetailProject(updated);
            }}
            onDelete={(p) => { setDetailProject(null); setDeleteTarget(p); }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">Projects</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {loading ? "Loading..." : `${projects.length} project${projects.length !== 1 ? "s" : ""}${activeCount > 0 ? ` · ${activeCount} in progress` : ""}`}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={fetchProjects}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="gradient" size="sm" onClick={() => setNewOpen(true)}>
            <Plus size={14} />
            <span className="hidden sm:inline">New Project</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          <AlertTriangle size={14} /> {error}
          <button onClick={fetchProjects} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {loading && (
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl border border-riden-border p-5 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2 flex-1"><div className="w-40 h-4 rounded bg-riden-muted" /><div className="w-24 h-3 rounded bg-riden-muted" /></div>
                <div className="w-16 h-5 rounded bg-riden-muted" />
              </div>
              <div className="w-full h-2 rounded bg-riden-muted mb-4" />
              <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((j) => <div key={j} className="h-12 rounded-lg bg-riden-muted" />)}</div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl border border-riden-border py-20 flex flex-col items-center justify-center text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-riden-muted border border-riden-border flex items-center justify-center mb-5">
            <FolderOpen size={28} className="text-slate-500" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">No projects yet</h3>
          <p className="text-sm text-slate-500 max-w-xs mb-6">Create your first project to start tracking client work, budgets, and progress.</p>
          <Button variant="gradient" size="sm" onClick={() => setNewOpen(true)}><Plus size={14} /> New Project</Button>
        </motion.div>
      )}

      {/* Project cards */}
      {!loading && projects.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          {projects.map((project, i) => {
            const cfg = STATUS_CONFIG[project.status] ?? { label: project.status, color: "text-slate-400", bg: "bg-slate-400" };
            const budgetPct = project.budget > 0 ? Math.min(100, (project.spent / project.budget) * 100) : 0;
            const cardProfit = Number(project.budget) - Number(project.spent);

            return (
              <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                onClick={() => setDetailProject(project)}
                className="glass-card rounded-xl border border-riden-border p-5 hover:border-white/10 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white mb-0.5 truncate">{project.name}</div>
                    <div className="text-xs text-slate-500 truncate">{project.clientName || "No client"}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === project.id ? null : project.id); }}
                        className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      <AnimatePresence>
                        {menuOpenId === project.id && (
                          <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.12 }}
                            className="absolute right-0 top-9 z-30 min-w-[150px] glass-card rounded-xl border border-riden-border shadow-xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => { setDetailProject(project); setMenuOpenId(null); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                            >
                              <Eye size={13} /> View Details
                            </button>
                            <div className="h-px bg-riden-border" />
                            <button
                              onClick={() => { setDeleteTarget(project); setMenuOpenId(null); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span>Progress</span>
                    <span className="text-white font-medium">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-riden-muted rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${project.progress}%` }} transition={{ duration: 0.8, delay: i * 0.06 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full" />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="text-center p-2 bg-riden-surface rounded-lg border border-riden-border">
                    <div className="text-xs font-bold text-white truncate">{formatCurrency(Number(project.budget))}</div>
                    <div className="text-[10px] text-slate-500">Budget</div>
                  </div>
                  <div className="text-center p-2 bg-riden-surface rounded-lg border border-riden-border">
                    <div className={`text-xs font-bold truncate ${budgetPct > 90 ? "text-red-400" : "text-white"}`}>{formatCurrency(Number(project.spent))}</div>
                    <div className="text-[10px] text-slate-500">Spent</div>
                  </div>
                  <div className="text-center p-2 bg-riden-surface rounded-lg border border-riden-border">
                    <div className={`text-xs font-bold truncate ${cardProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCurrency(cardProfit)}</div>
                    <div className="text-[10px] text-slate-500">Profit</div>
                  </div>
                </div>

                {project.notes && <p className="mt-3 text-[11px] text-slate-500 line-clamp-2">{project.notes}</p>}

                {/* Details hint */}
                <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors">
                  <Eye size={10} /> Click to view details
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <NewProjectModal open={newOpen} onClose={() => setNewOpen(false)} onSave={(p) => { setProjects((prev) => [p, ...prev]); showToast("Project created.", "success"); }} />
    </div>
  );
}
