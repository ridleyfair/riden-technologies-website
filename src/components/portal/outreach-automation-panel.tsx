"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Mail, Send, RefreshCw, CheckCircle, Clock, XCircle,
  AlertTriangle, Users, ChevronDown, ChevronUp, Globe, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Stats = {
  queued: number; approved: number; sent: number;
  responded: number; failed: number; opted_out: number;
  leads_created: number; projects_created: number;
  forms_started: number; ms_configured: boolean;
};

type OutreachRecord = {
  id: string; business_name: string; business_email: string;
  preview_url: string; outreach_status: string; approved: boolean;
  outreach_email_sent_at: string | null; form_submitted_at: string | null;
  converted_lead_id: string | null; error_message: string | null;
  form_token: string; created_at: string;
};

type ActionResult = { queued?: number; sent?: number; failed?: number; message?: string; error?: string };

const STATUS_STYLE: Record<string, string> = {
  queued:     "bg-slate-500/10 text-slate-400 border-slate-500/20",
  sent:       "bg-blue-500/10 text-blue-400 border-blue-500/20",
  responded:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed:     "bg-red-500/10 text-red-400 border-red-500/20",
  opted_out:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const STATUS_LABEL: Record<string, string> = {
  queued: "Queued", sent: "Sent", responded: "Responded",
  failed: "Failed", opted_out: "Opted Out",
};

export default function OutreachAutomationPanel() {
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [records,  setRecords]  = useState<OutreachRecord[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [acting,   setActing]   = useState(false);
  const [result,   setResult]   = useState<ActionResult | null>(null);
  const [autoMode, setAutoMode] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, recRes] = await Promise.all([
        fetch("/api/automations/outreach"),
        fetch("/api/automations/outreach/records?limit=50"),
      ]);
      if (statsRes.ok)  setStats(await statsRes.json() as Stats);
      if (recRes.ok)    setRecords(await recRes.json() as OutreachRecord[]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function doAction(action: string, extra?: Record<string, unknown>) {
    setActing(true); setResult(null);
    try {
      const res  = await fetch("/api/automations/outreach", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action, ...extra }),
      });
      const data = await res.json() as ActionResult;
      setResult(data);
      await load();
    } finally { setActing(false); }
  }

  async function patchRecord(id: string, patchAction: string) {
    await fetch("/api/automations/outreach/records", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id, action: patchAction }),
    });
    load();
  }

  const convRate = stats && stats.sent > 0
    ? Math.round((stats.responded / stats.sent) * 100)
    : null;

  const statCards = stats ? [
    { label: "Queued",           value: stats.queued,           color: "text-slate-400",   icon: Clock },
    { label: "Awaiting Send",    value: stats.approved,         color: "text-violet-400",  icon: CheckCircle },
    { label: "Emails Sent",      value: stats.sent,             color: "text-blue-400",    icon: Send },
    { label: "Brief Forms",      value: stats.responded,        color: "text-emerald-400", icon: Mail },
    { label: "Leads Created",    value: stats.leads_created,    color: "text-cyan-400",    icon: Users },
    { label: "Projects Created", value: stats.projects_created, color: "text-purple-400",  icon: Globe },
    { label: "Failed",           value: stats.failed,           color: "text-red-400",     icon: XCircle },
    { label: "Opted Out",        value: stats.opted_out,        color: "text-amber-400",   icon: AlertTriangle },
    {
      label: "Conversion",
      value: convRate !== null ? `${convRate}%` : "—",
      color: convRate !== null && convRate >= 10 ? "text-emerald-400" : "text-slate-400",
      icon: Users,
    },
  ] : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl border border-riden-border overflow-hidden mb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-riden-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Mail size={16} className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Website Brief Outreach</p>
            <p className="text-xs text-slate-500 mt-0.5">Invite possible clients to complete a free website brief</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-px bg-riden-border">
        {statCards.map((s) => (
          <div key={s.label} className="bg-riden-darker px-3 py-3">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-slate-600 mt-0.5 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="px-5 py-4 border-b border-riden-border flex flex-wrap items-center gap-3">
        {/* MS config warning */}
        {stats && !stats.ms_configured && (
          <div className="w-full text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertTriangle size={13} />
            Microsoft Graph not configured — email sending disabled. Set MICROSOFT_TENANT_ID, CLIENT_ID, CLIENT_SECRET, SHARED_MAILBOX and grant Mail.Send Application permission.
          </div>
        )}

        <Button variant="outline" size="sm" onClick={() => doAction("queue")} disabled={acting}>
          {acting ? <RefreshCw size={13} className="animate-spin" /> : <Clock size={13} />}
          Scan eligible sites
        </Button>

        {/* Approve all */}
        {stats && stats.queued > 0 && !autoMode && (
          <Button variant="outline" size="sm" onClick={() => patchRecord("", "approve_all")} disabled={acting}
            className="text-violet-400 border-violet-500/30 hover:border-violet-500/60">
            <CheckCircle size={13} /> Approve all ({stats.queued})
          </Button>
        )}

        <Button
          variant="gradient"
          size="sm"
          onClick={() => doAction("send", { mode: autoMode ? "auto" : "approve", limit: 20 })}
          disabled={acting || (stats ? !stats.ms_configured : true)}
        >
          {acting ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
          {autoMode ? "Send all queued" : "Send approved"}
        </Button>

        {/* Auto / Approve mode toggle */}
        <label className="flex items-center gap-2 cursor-pointer ml-auto">
          <span className="text-xs text-slate-500">Manual approval</span>
          <div
            onClick={() => setAutoMode((v) => !v)}
            className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${autoMode ? "bg-slate-600" : "bg-blue-600"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${autoMode ? "translate-x-0.5" : "translate-x-4"}`} />
          </div>
          <span className="text-xs text-slate-500">Auto send</span>
        </label>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`px-5 py-3 text-xs border-b border-riden-border ${result.error ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
          {result.error
            ? `Error: ${result.error}`
            : result.message
            ? result.message
            : `Queued: ${result.queued ?? "—"} · Sent: ${result.sent ?? "—"} · Failed: ${result.failed ?? "—"}`}
        </div>
      )}

      {/* Records table */}
      {expanded && (
        <div className="overflow-x-auto">
          {records.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-600">
              No outreach records yet. Click &quot;Scan eligible sites&quot; to build the queue.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-riden-border bg-riden-surface/50">
                  {["Business", "Email", "Status", "Sent", "Responded", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-riden-border">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white truncate max-w-[160px]">{r.business_name || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 truncate max-w-[160px]">{r.business_email}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_STYLE[r.outreach_status] ?? STATUS_STYLE.queued}`}>
                          {STATUS_LABEL[r.outreach_status] ?? r.outreach_status}
                        </span>
                        {r.outreach_status === "queued" && !r.approved && (
                          <button onClick={() => patchRecord(r.id, "approve")}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 transition-colors whitespace-nowrap">
                            Approve
                          </button>
                        )}
                      </div>
                      {r.error_message && (
                        <div className="text-[10px] text-red-400 mt-1 truncate max-w-[180px]" title={r.error_message}>
                          {r.error_message}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {r.outreach_email_sent_at ? new Date(r.outreach_email_sent_at).toLocaleDateString("en-GB") : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {r.form_submitted_at ? new Date(r.form_submitted_at).toLocaleDateString("en-GB") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        {/* Preview the email that will be sent */}
                        <a href={`/api/automations/outreach/preview/${r.id}`} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-riden-muted text-slate-500 hover:text-blue-400 transition-colors" title="Preview email">
                          <Mail size={12} />
                        </a>
                        {/* View website preview if one exists */}
                        {r.preview_url && (
                          <a href={r.preview_url} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors" title="View website preview">
                            <Globe size={12} />
                          </a>
                        )}
                        {/* FileText icon → open the client brief form as the client would see it */}
                        <a href={`/client-brief/${r.form_token}`} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-riden-muted text-slate-500 hover:text-violet-400 transition-colors" title="Preview client brief form">
                          <FileText size={12} />
                        </a>
                        {r.outreach_status === "failed" && (
                          <button onClick={() => patchRecord(r.id, "retry")}
                            className="p-1.5 rounded hover:bg-riden-muted text-slate-500 hover:text-amber-400 transition-colors" title="Retry">
                            <RefreshCw size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </motion.div>
  );
}
