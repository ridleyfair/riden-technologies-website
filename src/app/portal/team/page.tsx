"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Shield, Mail, MoreHorizontal, X, Trash2, RefreshCw, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Member = { id: string; name: string; email: string; role: string };
type Invite = { id: string; name: string; email: string; role: string; status: string; createdAt: string };

const ROLE_COLORS: Record<string, "default" | "violet" | "cyan" | "success" | "warning" | "secondary"> = {
  owner: "violet", admin: "default", designer: "cyan", developer: "success", sales: "warning", support: "secondary",
};

const MEMBER_AVATARS: Record<string, { initials: string; gradient: string }> = {
  "ridley@ridentechnologies.com": { initials: "RF", gradient: "from-blue-500 to-violet-600" },
  "denis@ridentechnologies.com": { initials: "DB", gradient: "from-violet-500 to-cyan-500" },
};

function getAvatar(email: string, name: string) {
  if (MEMBER_AVATARS[email]) return MEMBER_AVATARS[email];
  const parts = name.split(" ");
  const initials = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2);
  const gradients = ["from-pink-500 to-rose-500", "from-amber-500 to-orange-500", "from-green-500 to-teal-500", "from-cyan-500 to-blue-500"];
  return { initials: initials.toUpperCase(), gradient: gradients[name.charCodeAt(0) % gradients.length] };
}

const inputCls = "w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors";

function InviteModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", role: "designer" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setForm({ name: "", email: "", role: "designer" }); setError(""); }
  }, [open]);

  async function handleSave() {
    if (!form.name || !form.email) { setError("Name and email are required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed."); return; }
      onSave(); onClose();
    } catch { setError("Network error."); } finally { setSaving(false); }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }} transition={{ duration: 0.2 }}
            className="relative w-full max-w-md glass-card rounded-2xl border border-riden-border"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-riden-border">
              <h2 className="text-base font-semibold text-white">Invite Team Member</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Full Name</label>
                <input className={inputCls} placeholder="Jane Smith" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Email Address</label>
                <input type="email" className={inputCls} placeholder="jane@example.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Role</label>
                <select className={inputCls} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                  <option value="admin">Admin</option>
                  <option value="designer">Designer</option>
                  <option value="developer">Developer</option>
                  <option value="sales">Sales</option>
                  <option value="support">Support</option>
                </select>
              </div>
              {error && <p className="text-xs text-rose-400">{error}</p>}
            </div>
            <div className="flex gap-3 px-5 py-4 border-t border-riden-border">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button variant="gradient" className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      setMembers(data.members ?? []);
      setInvites(data.invites ?? []);
    } catch {
      setMembers([]); setInvites([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  async function revokeInvite(id: string) {
    if (!confirm("Remove this invite?")) return;
    await fetch(`/api/team/${id}`, { method: "DELETE" });
    fetchTeam();
  }

  const activeCount = members.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Team Management</h2>
          <p className="text-sm text-slate-500">{activeCount} active team member{activeCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchTeam}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="gradient" size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Invite Member
          </Button>
        </div>
      </div>

      {/* Active Members */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Active Members</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="glass-card rounded-xl border border-riden-border p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-riden-muted" />
                    <div className="space-y-2">
                      <div className="h-4 w-28 rounded bg-riden-muted" />
                      <div className="h-3 w-20 rounded bg-riden-muted" />
                    </div>
                  </div>
                </div>
              ))
            : members.map((member, i) => {
                const avatar = getAvatar(member.email, member.name);
                return (
                  <motion.div key={member.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="glass-card rounded-xl border border-riden-border p-5 hover:border-white/10 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatar.gradient} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>
                          {avatar.initials}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{member.name}</div>
                          <span className="flex items-center gap-1 text-xs text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active</span>
                        </div>
                      </div>
                      <button className="p-1 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={ROLE_COLORS[member.role] || "secondary"} className="capitalize">{member.role}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                      <Mail size={12} />{member.email}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs">View Profile</Button>
                      <Button variant="ghost" size="sm" className="text-xs"><Shield size={12} /></Button>
                    </div>
                  </motion.div>
                );
              })}
        </div>
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Pending Invites</h3>
          <div className="glass-card rounded-xl border border-riden-border overflow-hidden">
            <div className="divide-y divide-riden-border">
              {invites.map((invite, i) => {
                const avatar = getAvatar(invite.email, invite.name);
                return (
                  <motion.div key={invite.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 px-5 py-4">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatar.gradient} flex items-center justify-center text-xs font-bold text-white flex-shrink-0 opacity-60`}>
                      {avatar.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{invite.name}</div>
                      <div className="text-xs text-slate-500">{invite.email}</div>
                    </div>
                    <Badge variant={ROLE_COLORS[invite.role] || "secondary"} className="capitalize text-[10px] hidden sm:flex">{invite.role}</Badge>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">Pending</span>
                    <button onClick={() => revokeInvite(invite.id)} className="p-1.5 rounded hover:bg-riden-muted text-slate-500 hover:text-rose-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Invite CTA when empty */}
      {!loading && members.length === 0 && invites.length === 0 && (
        <div className="glass-card rounded-xl border border-riden-border p-12 text-center">
          <UserPlus size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">Build your team</p>
          <p className="text-sm text-slate-500 mb-4">Invite colleagues to collaborate in the portal.</p>
          <Button variant="gradient" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Invite Member
          </Button>
        </div>
      )}

      <InviteModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={fetchTeam} />
    </div>
  );
}
