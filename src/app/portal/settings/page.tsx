"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Bell, Shield, CreditCard, Globe, Key, Save, Eye, EyeOff,
  Copy, RefreshCw, CheckCircle, Zap, Link, MessageSquare, BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "integrations", label: "Integrations", icon: Globe },
  { id: "api", label: "API Keys", icon: Key },
];

const inputCls = "w-full bg-riden-muted border border-riden-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600";

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium ${
        type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
      }`}>
      <CheckCircle size={14} />
      {message}
    </motion.div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!enabled)}
      className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${enabled ? "bg-blue-600" : "bg-riden-muted border border-riden-border"}`}>
      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="flex gap-4 sm:gap-6 h-full">
      {/* Settings Nav */}
      <div className="w-44 sm:w-52 flex-shrink-0">
        <nav className="space-y-1">
          {sections.map((section) => (
            <button key={section.id} onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                activeSection === section.id
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                  : "text-slate-500 hover:text-white hover:bg-riden-muted"
              }`}>
              <section.icon size={16} />
              <span className="hidden sm:inline">{section.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <motion.div key={activeSection} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        className="flex-1 glass-card rounded-xl border border-riden-border p-5 sm:p-6 overflow-y-auto portal-scroll">
        {activeSection === "profile" && <ProfileSection showToast={showToast} />}
        {activeSection === "notifications" && <NotificationsSection showToast={showToast} />}
        {activeSection === "security" && <SecuritySection showToast={showToast} />}
        {activeSection === "billing" && <BillingSection />}
        {activeSection === "integrations" && <IntegrationsSection showToast={showToast} />}
        {activeSection === "api" && <ApiKeysSection showToast={showToast} />}
      </motion.div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

/* ── Profile ─────────────────────────────────────────────────────── */
function ProfileSection({ showToast }: { showToast: (m: string, t?: "success" | "error") => void }) {
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", company: "Riden Technologies" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.user) setProfile((p) => ({ ...p, name: d.user.name ?? "", email: d.user.email ?? "", phone: d.user.phone ?? "", company: d.user.company ?? "Riden Technologies" }));
    }).catch(() => {});
  }, []);

  const initials = profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
      if (res.ok) showToast("Profile saved");
      else showToast("Failed to save", "error");
    } catch { showToast("Network error", "error"); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-white mb-1">Profile Settings</h3>
        <p className="text-xs text-slate-500">Update your personal information and company details.</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{profile.name || "—"}</p>
          <p className="text-xs text-slate-500">{profile.email}</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Full Name</label>
          <input className={inputCls} value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2">Email Address</label>
          <input className={inputCls + " opacity-60 cursor-not-allowed"} value={profile.email} disabled />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2">Phone</label>
          <input className={inputCls} placeholder="+44 7700 900000" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2">Company</label>
          <input className={inputCls} value={profile.company} onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="gradient" onClick={handleSave} disabled={saving}>
          <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

/* ── Notifications ───────────────────────────────────────────────── */
const NOTIF_DEFAULTS = [
  { key: "new_lead", label: "New Lead Notification", desc: "Get notified when a new lead submits the contact form" },
  { key: "invoice_due", label: "Invoice Reminders", desc: "Reminders for overdue or upcoming invoices" },
  { key: "project_update", label: "Project Updates", desc: "Updates when project status changes" },
  { key: "automation_fail", label: "Automation Alerts", desc: "Alerts when an automation fails or completes with errors" },
  { key: "weekly_report", label: "Weekly Reports", desc: "Receive weekly performance summary by email" },
  { key: "team_activity", label: "Team Activity", desc: "Updates on team member actions and invites" },
];

function NotificationsSection({ showToast }: { showToast: (m: string, t?: "success" | "error") => void }) {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("notif_prefs") : null;
    if (saved) return JSON.parse(saved);
    return Object.fromEntries(NOTIF_DEFAULTS.map((n) => [n.key, n.key !== "team_activity"]));
  });

  function toggle(key: string, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem("notif_prefs", JSON.stringify(next));
    showToast("Preferences saved");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-white mb-1">Notification Preferences</h3>
        <p className="text-xs text-slate-500">Choose when and how you receive notifications.</p>
      </div>
      <div className="space-y-1">
        {NOTIF_DEFAULTS.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-3.5 border-b border-riden-border last:border-0">
            <div>
              <div className="text-sm text-white">{item.label}</div>
              <div className="text-xs text-slate-500">{item.desc}</div>
            </div>
            <Toggle enabled={prefs[item.key] ?? false} onChange={(v) => toggle(item.key, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Security ────────────────────────────────────────────────────── */
function SecuritySection({ showToast }: { showToast: (m: string, t?: "success" | "error") => void }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleChange() {
    if (!form.currentPassword || !form.newPassword) { showToast("All fields required", "error"); return; }
    if (form.newPassword !== form.confirmPassword) { showToast("Passwords don't match", "error"); return; }
    if (form.newPassword.length < 8) { showToast("Password must be at least 8 characters", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }) });
      if (res.ok) { showToast("Password updated"); setForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }
      else { const d = await res.json(); showToast(d.error ?? "Failed to update", "error"); }
    } catch { showToast("Network error", "error"); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-white mb-1">Security Settings</h3>
        <p className="text-xs text-slate-500">Manage your password and account security.</p>
      </div>
      <div className="glass-card rounded-xl border border-riden-border p-5 space-y-4">
        <h4 className="text-sm font-medium text-white">Change Password</h4>
        <div>
          <label className="block text-sm text-slate-400 mb-2">Current Password</label>
          <div className="relative">
            <input type={showCurrent ? "text" : "password"} className={inputCls + " pr-10"} value={form.currentPassword} onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))} />
            <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
              {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2">New Password</label>
          <div className="relative">
            <input type={showNew ? "text" : "password"} className={inputCls + " pr-10"} value={form.newPassword} onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))} />
            <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
              {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2">Confirm New Password</label>
          <input type="password" className={inputCls} value={form.confirmPassword} onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))} />
        </div>
        <Button variant="gradient" onClick={handleChange} disabled={saving}>
          <Shield size={14} /> {saving ? "Updating..." : "Update Password"}
        </Button>
      </div>
      <div className="glass-card rounded-xl border border-riden-border p-5">
        <h4 className="text-sm font-medium text-white mb-3">Active Sessions</h4>
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm text-white">Current session</div>
            <div className="text-xs text-slate-500">This browser — logged in now</div>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Active</span>
        </div>
      </div>
    </div>
  );
}

/* ── Billing ─────────────────────────────────────────────────────── */
function BillingSection() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-white mb-1">Billing & Subscription</h3>
        <p className="text-xs text-slate-500">Manage your plan and billing details.</p>
      </div>
      <div className="glass-card rounded-xl border border-blue-500/20 p-5" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.06), transparent)" }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base font-bold text-white">Enterprise Plan</span>
              <Badge variant="success" className="text-[10px]">Active</Badge>
            </div>
            <p className="text-xs text-slate-500">Full CRM + Analytics + Automations + Priority Support</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-white">£299<span className="text-sm font-normal text-slate-500">/mo</span></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-riden-border">
          {[
            { label: "Next billing", value: "1 Jun 2026" },
            { label: "Clients included", value: "Unlimited" },
            { label: "Team seats", value: "10 seats" },
          ].map((item, i) => (
            <div key={i}>
              <div className="text-xs text-slate-500">{item.label}</div>
              <div className="text-sm font-medium text-white mt-0.5">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { name: "Starter", price: "£49/mo", features: ["Up to 5 clients", "Basic CRM", "Invoicing", "Email support"] },
          { name: "Growth", price: "£149/mo", features: ["Up to 25 clients", "Full CRM", "Automations", "Analytics", "Priority support"] },
          { name: "Enterprise", price: "£299/mo", features: ["Unlimited clients", "Full suite", "Custom automations", "Dedicated manager"], current: true },
        ].map((plan) => (
          <div key={plan.name} className={`glass-card rounded-xl border p-4 ${plan.current ? "border-blue-500/30" : "border-riden-border"}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-white">{plan.name}</span>
              {plan.current && <Badge variant="default" className="text-[10px]">Current</Badge>}
            </div>
            <div className="text-lg font-bold text-white mb-3">{plan.price}</div>
            <ul className="space-y-1.5 mb-4">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle size={11} className="text-emerald-400 flex-shrink-0" />{f}
                </li>
              ))}
            </ul>
            {!plan.current && <Button variant="outline" size="sm" className="w-full text-xs">Downgrade</Button>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Integrations ────────────────────────────────────────────────── */
const INTEGRATIONS = [
  { key: "zapier", name: "Zapier", desc: "Connect to 5,000+ apps and automate workflows", icon: Zap, color: "text-orange-400", bg: "bg-orange-500/10" },
  { key: "slack", name: "Slack", desc: "Get real-time notifications in your Slack channels", icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-500/10" },
  { key: "google", name: "Google Calendar", desc: "Sync bookings and meetings with Google Calendar", icon: Globe, color: "text-blue-400", bg: "bg-blue-500/10" },
  { key: "analytics", name: "Google Analytics", desc: "Push CRM events to Google Analytics", icon: BarChart2, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { key: "stripe", name: "Stripe", desc: "Sync invoice payments and billing data", icon: CreditCard, color: "text-violet-400", bg: "bg-violet-500/10" },
  { key: "webhook", name: "Webhooks", desc: "Send HTTP webhooks on any CRM event", icon: Link, color: "text-cyan-400", bg: "bg-cyan-500/10" },
];

function IntegrationsSection({ showToast }: { showToast: (m: string, t?: "success" | "error") => void }) {
  const [connected, setConnected] = useState<Record<string, boolean>>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("integrations") : null;
    return saved ? JSON.parse(saved) : {};
  });

  function toggle(key: string) {
    const next = { ...connected, [key]: !connected[key] };
    setConnected(next);
    localStorage.setItem("integrations", JSON.stringify(next));
    showToast(next[key] ? `${key} connected` : `${key} disconnected`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-white mb-1">Integrations</h3>
        <p className="text-xs text-slate-500">Connect your favourite tools to extend your CRM.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {INTEGRATIONS.map((integration) => {
          const Icon = integration.icon;
          const isOn = connected[integration.key] ?? false;
          return (
            <div key={integration.key} className="glass-card rounded-xl border border-riden-border p-4 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl ${integration.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={integration.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-sm font-semibold text-white">{integration.name}</span>
                  <Toggle enabled={isOn} onChange={() => toggle(integration.key)} />
                </div>
                <p className="text-xs text-slate-500">{integration.desc}</p>
                {isOn && <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Connected</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── API Keys ────────────────────────────────────────────────────── */
function ApiKeysSection({ showToast }: { showToast: (m: string, t?: "success" | "error") => void }) {
  const [keys, setKeys] = useState<Array<{ id: string; name: string; key: string; created: string; lastUsed?: string }>>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("api_keys") : null;
    if (saved) return JSON.parse(saved);
    return [
      { id: "1", name: "Production Key", key: "rt_live_" + Math.random().toString(36).slice(2, 18), created: "2026-01-15", lastUsed: "Today" },
    ];
  });
  const [newName, setNewName] = useState("");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  function generateKey() {
    if (!newName.trim()) { showToast("Enter a key name first", "error"); return; }
    const next = [...keys, { id: crypto.randomUUID(), name: newName, key: "rt_live_" + Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 10), created: new Date().toISOString().split("T")[0] }];
    setKeys(next);
    localStorage.setItem("api_keys", JSON.stringify(next));
    setNewName("");
    showToast("API key created");
  }

  function deleteKey(id: string) {
    const next = keys.filter((k) => k.id !== id);
    setKeys(next);
    localStorage.setItem("api_keys", JSON.stringify(next));
    showToast("Key revoked");
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key).then(() => showToast("Key copied to clipboard")).catch(() => {});
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-white mb-1">API Keys</h3>
        <p className="text-xs text-slate-500">Use these keys to access the Riden Technologies API.</p>
      </div>
      <div className="glass-card rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <p className="text-xs text-amber-400">Keep your API keys secret. Never share them in public code repositories or client-side code.</p>
      </div>
      <div className="space-y-3">
        {keys.map((k) => (
          <div key={k.id} className="glass-card rounded-xl border border-riden-border p-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <Key size={14} className="text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white mb-0.5">{k.name}</div>
              <div className="font-mono text-xs text-slate-500 truncate">
                {revealed[k.id] ? k.key : k.key.slice(0, 12) + "••••••••••••"}
              </div>
              <div className="text-[10px] text-slate-600 mt-1">Created {k.created}{k.lastUsed ? ` · Last used: ${k.lastUsed}` : ""}</div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => setRevealed((r) => ({ ...r, [k.id]: !r[k.id] }))}
                className="p-1.5 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors" title="Show/hide">
                {revealed[k.id] ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button onClick={() => copyKey(k.key)}
                className="p-1.5 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors" title="Copy">
                <Copy size={13} />
              </button>
              <button onClick={() => deleteKey(k.id)}
                className="p-1.5 rounded hover:bg-riden-muted text-slate-500 hover:text-rose-400 transition-colors" title="Revoke">
                <RefreshCw size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <input className={inputCls + " flex-1"} placeholder="Key name (e.g. Zapier Integration)"
          value={newName} onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generateKey()} />
        <Button variant="gradient" onClick={generateKey}>
          <Plus size={14} /> Generate
        </Button>
      </div>
    </div>
  );
}

function Plus({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
