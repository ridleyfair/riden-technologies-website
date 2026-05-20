"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText, Plus, DollarSign, Clock, CheckCircle, AlertCircle,
  Printer, Edit2, Trash2, RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import InvoiceModal, { type InvoiceData, type LineItem } from "@/components/portal/invoice-modal";

const STATUS_CONFIG = {
  paid:      { label: "Paid",     variant: "success"     as const, icon: CheckCircle },
  sent:      { label: "Sent",     variant: "default"     as const, icon: Clock },
  overdue:   { label: "Overdue",  variant: "destructive" as const, icon: AlertCircle },
  draft:     { label: "Draft",    variant: "secondary"   as const, icon: FileText },
  cancelled: { label: "Cancelled",variant: "secondary"   as const, icon: FileText },
};

type RawInvoice = {
  id: string; number: string; clientId?: string; clientName: string; clientEmail?: string;
  amount: number; status: string; dueDate?: string; paidAt?: string; createdAt: string;
  taxRate?: number; discount?: number; notes?: string;
  lineItems?: Array<{ id: string; description: string; quantity: number; unitPrice: number; amount: number }>;
};

function buildPrintHTML(inv: RawInvoice) {
  const items = inv.lineItems ?? [];
  const subtotal = items.length > 0
    ? items.reduce((s, li) => s + li.quantity * li.unitPrice, 0)
    : inv.amount;
  const taxRate = inv.taxRate ?? 0;
  const discount = inv.discount ?? 0;
  const taxAmount = subtotal * taxRate / 100;
  const total = items.length > 0 ? Math.max(0, subtotal + taxAmount - discount) : inv.amount;

  const rows = items.length > 0
    ? items.map((li) => `<tr>
        <td>${li.description}</td>
        <td style="text-align:right">${li.quantity}</td>
        <td style="text-align:right">$${li.unitPrice.toFixed(2)}</td>
        <td style="text-align:right">$${(li.quantity * li.unitPrice).toFixed(2)}</td>
      </tr>`).join("")
    : `<tr><td>${inv.clientName} — services</td><td style="text-align:right">1</td>
        <td style="text-align:right">$${inv.amount.toFixed(2)}</td>
        <td style="text-align:right">$${inv.amount.toFixed(2)}</td></tr>`;

  const statusClass = { paid: "status-paid", overdue: "status-overdue", sent: "status-sent", draft: "status-draft" }[inv.status] ?? "status-draft";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${inv.number}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;color:#111827;padding:40px;max-width:800px;margin:0 auto}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px}
  .brand{font-size:22px;font-weight:800;color:#1d4ed8}.brand-sub{font-size:12px;color:#6b7280;margin-top:2px}
  .inv-meta{text-align:right}.inv-number{font-size:22px;font-weight:700}.inv-date{font-size:13px;color:#6b7280;margin-top:4px}
  .status-badge{display:inline-block;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-top:6px}
  .status-paid{background:#d1fae5;color:#065f46}.status-overdue{background:#fee2e2;color:#991b1b}
  .status-sent{background:#dbeafe;color:#1e40af}.status-draft{background:#f3f4f6;color:#374151}
  .bill-section{display:flex;gap:60px;margin-bottom:32px}.bill-block h4{font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:#9ca3af;margin-bottom:8px}
  .bill-block p{font-size:14px}hr.divider{border:none;border-top:1px solid #e5e7eb;margin:24px 0}
  table{width:100%;border-collapse:collapse;margin-bottom:24px}
  thead th{font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;padding:8px 10px;background:#f9fafb;border-bottom:2px solid #e5e7eb}
  tbody td{padding:12px 10px;font-size:13px;border-bottom:1px solid #f3f4f6}
  .totals{margin-left:auto;width:260px}.totals .row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;color:#374151}
  .totals .total-row{display:flex;justify-content:space-between;padding:10px 0 4px;font-size:16px;font-weight:700;border-top:2px solid #111827;margin-top:6px}
  .footer{margin-top:48px;text-align:center;font-size:12px;color:#9ca3af}
  @media print{@page{margin:20mm}body{padding:0}}
</style></head><body>
<div class="header">
  <div><div class="brand">Riden Technologies</div><div class="brand-sub">AI-Powered Websites &amp; Automation</div></div>
  <div class="inv-meta">
    <div class="inv-number">${inv.number}</div>
    <div class="inv-date">Issued: ${new Date(inv.createdAt).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
    ${inv.dueDate ? `<div class="inv-date">Due: ${new Date(inv.dueDate).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>` : ""}
    <div><span class="status-badge ${statusClass}">${inv.status}</span></div>
  </div>
</div>
<div class="bill-section">
  <div class="bill-block"><h4>Bill To</h4><p><strong>${inv.clientName}</strong></p>${inv.clientEmail ? `<p style="color:#6b7280">${inv.clientEmail}</p>` : ""}</div>
  <div class="bill-block"><h4>Payment</h4><p>Riden Technologies</p><p style="color:#6b7280">ridentechnologies.com</p></div>
</div>
<hr class="divider">
<table><thead><tr><th style="text-align:left">Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Amount</th></tr></thead>
<tbody>${rows}</tbody></table>
<div class="totals">
  <div class="row"><span>Subtotal</span><span>£${subtotal.toFixed(2)}</span></div>
  ${taxRate > 0 ? `<div class="row"><span>Tax (${taxRate}%)</span><span>£${taxAmount.toFixed(2)}</span></div>` : ""}
  ${discount > 0 ? `<div class="row"><span>Discount</span><span>-£${discount.toFixed(2)}</span></div>` : ""}
  <div class="total-row"><span>Total Due</span><span>£${total.toFixed(2)}</span></div>
</div>
${inv.notes ? `<div style="margin-top:32px;padding:16px;background:#f9fafb;border-radius:8px;font-size:13px"><h4 style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af;margin-bottom:6px">Notes</h4><p>${inv.notes}</p></div>` : ""}
<div class="footer">Thank you for your business — Riden Technologies</div>
<script>setTimeout(()=>window.print(),400);</script>
</body></html>`;
}

export default function InvoicesView() {
  const [invoices, setInvoices] = useState<RawInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editInvoice, setEditInvoice] = useState<Partial<InvoiceData> | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);
  const totalOutstanding = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + Number(i.amount), 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + Number(i.amount), 0);

  function openCreate() {
    setModalMode("create");
    setEditInvoice(undefined);
    setModalOpen(true);
  }

  function openEdit(inv: RawInvoice) {
    setModalMode("edit");
    setEditInvoice({
      id: inv.id,
      number: inv.number,
      clientName: inv.clientName,
      clientEmail: inv.clientEmail ?? "",
      clientId: inv.clientId,
      dueDate: inv.dueDate ? inv.dueDate.split("T")[0] : "",
      status: inv.status,
      taxRate: inv.taxRate ?? 0,
      discount: inv.discount ?? 0,
      notes: inv.notes ?? "",
      lineItems: (inv.lineItems ?? []).map((li) => ({
        tempId: li.id,
        id: li.id,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
      } as LineItem)),
    });
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    setDeletingId(id);
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    setDeletingId(null);
    fetchInvoices();
  }

  async function markPaid(inv: RawInvoice) {
    await fetch(`/api/invoices/${inv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    fetchInvoices();
  }

  const statCards = [
    { label: "Total Paid", value: formatCurrency(totalPaid), icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Outstanding", value: formatCurrency(totalOutstanding), icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Overdue", value: formatCurrency(totalOverdue), icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Total Invoices", value: String(invoices.length), icon: DollarSign, color: "text-violet-400", bg: "bg-violet-500/10" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">Invoices & Billing</h2>
          <p className="text-xs sm:text-sm text-slate-500">{invoices.length} invoices</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={fetchInvoices}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="gradient" size="sm" onClick={openCreate}>
            <Plus size={14} />
            <span className="hidden sm:inline">New Invoice</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl border border-riden-border p-3 sm:p-4 flex items-center gap-3 sm:gap-4"
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
              <stat.icon size={16} className={stat.color} />
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-lg font-bold text-white truncate">{stat.value}</div>
              <div className="text-[10px] sm:text-xs text-slate-500 leading-tight">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table — desktop */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl border border-riden-border overflow-hidden hidden md:block"
      >
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-riden-border bg-riden-surface/50 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <div className="col-span-2">Invoice #</div>
          <div className="col-span-3">Client</div>
          <div className="col-span-2">Amount</div>
          <div className="col-span-2">Due Date</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1"></div>
        </div>
        <div className="divide-y divide-riden-border">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 px-5 py-4 animate-pulse">
                  {[2,3,2,2,2,1].map((span, j) => (
                    <div key={j} className={`col-span-${span} h-4 rounded bg-riden-muted`} />
                  ))}
                </div>
              ))
            : invoices.length === 0
            ? <div className="py-12 text-center text-slate-500 text-sm">No invoices yet — create your first one.</div>
            : invoices.map((invoice) => {
                const config = STATUS_CONFIG[invoice.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft;
                return (
                  <div key={invoice.id} className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors items-center">
                    <div className="col-span-2 text-sm font-mono text-blue-400">{invoice.number}</div>
                    <div className="col-span-3">
                      <div className="text-sm text-white">{invoice.clientName}</div>
                      <div className="text-xs text-slate-500">{invoice.clientEmail || formatDate(invoice.createdAt)}</div>
                    </div>
                    <div className="col-span-2 text-sm font-semibold text-white">{formatCurrency(Number(invoice.amount))}</div>
                    <div className="col-span-2 text-sm text-slate-400">{invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</div>
                    <div className="col-span-2">
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                    <div className="col-span-1 flex justify-end gap-1">
                      <button
                        title="Print / PDF"
                        onClick={() => { const win = window.open("","_blank","width=900,height=700"); win?.document.write(buildPrintHTML(invoice)); win?.document.close(); }}
                        className="p-1.5 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors"
                      >
                        <Printer size={13} />
                      </button>
                      <button
                        title="Edit"
                        onClick={() => openEdit(invoice)}
                        className="p-1.5 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => handleDelete(invoice.id)}
                        disabled={deletingId === invoice.id}
                        className="p-1.5 rounded hover:bg-riden-muted text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
        </div>
      </motion.div>

      {/* Cards — mobile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="md:hidden glass-card rounded-xl border border-riden-border overflow-hidden"
      >
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">No invoices yet — create your first one.</div>
        ) : (
          <div className="divide-y divide-riden-border">
            {invoices.map((invoice) => {
              const config = STATUS_CONFIG[invoice.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft;
              const StatusIcon = config.icon;
              return (
                <div key={invoice.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="text-sm font-mono text-blue-400 mb-0.5">{invoice.number}</div>
                      <div className="text-sm font-medium text-white">{invoice.clientName}</div>
                      <div className="text-xs text-slate-500">{formatDate(invoice.createdAt)}</div>
                    </div>
                    <Badge variant={config.variant} className="text-[10px] flex-shrink-0">
                      <StatusIcon size={10} className="mr-1" />{config.label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-bold text-white">{formatCurrency(Number(invoice.amount))}</div>
                      <div className="text-xs text-slate-500">Due {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {invoice.status !== "paid" && (
                        <button
                          onClick={() => markPaid(invoice)}
                          className="px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/20 transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(invoice)}
                        className="p-2 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => { const win = window.open("","_blank","width=900,height=700"); win?.document.write(buildPrintHTML(invoice)); win?.document.close(); }}
                        className="p-2 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="p-2 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-rose-400 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <InvoiceModal
        open={modalOpen}
        mode={modalMode}
        initial={editInvoice}
        onClose={() => setModalOpen(false)}
        onSave={fetchInvoices}
      />
    </div>
  );
}
