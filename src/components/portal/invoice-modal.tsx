"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Printer, Send, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export type LineItem = {
  tempId: string;
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceData = {
  id?: string;
  number?: string;
  clientName: string;
  clientEmail: string;
  clientId?: string;
  dueDate: string;
  status: string;
  taxRate: number;
  discount: number;
  notes: string;
  lineItems: LineItem[];
};

interface InvoiceModalProps {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<InvoiceData>;
  onClose: () => void;
  onSave: () => void;
}

const STATUS_OPTIONS = ["draft", "sent", "paid", "overdue", "cancelled"];

function buildPrintHTML(inv: InvoiceData & { number: string; amount: number }) {
  const subtotal = inv.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
  const taxAmount = subtotal * inv.taxRate / 100;
  const total = Math.max(0, subtotal + taxAmount - inv.discount);

  const rows = inv.lineItems.length > 0
    ? inv.lineItems.map((li) => `
      <tr>
        <td>${li.description}</td>
        <td style="text-align:right">${li.quantity}</td>
        <td style="text-align:right">$${li.unitPrice.toFixed(2)}</td>
        <td style="text-align:right">$${(li.quantity * li.unitPrice).toFixed(2)}</td>
      </tr>`).join("")
    : `<tr><td colspan="4" style="color:#9ca3af">No line items</td></tr>`;

  const statusClass = { paid: "status-paid", overdue: "status-overdue", sent: "status-sent", draft: "status-draft" }[inv.status] ?? "status-draft";

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Invoice ${inv.number}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; color: #111827; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .brand { font-size: 22px; font-weight: 800; color: #1d4ed8; }
  .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .inv-meta { text-align: right; }
  .inv-number { font-size: 22px; font-weight: 700; }
  .inv-date { font-size: 13px; color: #6b7280; margin-top: 4px; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; margin-top: 6px; }
  .status-paid    { background: #d1fae5; color: #065f46; }
  .status-overdue { background: #fee2e2; color: #991b1b; }
  .status-sent    { background: #dbeafe; color: #1e40af; }
  .status-draft   { background: #f3f4f6; color: #374151; }
  .bill-section { display: flex; gap: 60px; margin-bottom: 32px; }
  .bill-block h4 { font-size: 11px; text-transform: uppercase; letter-spacing: .8px; color: #9ca3af; margin-bottom: 8px; }
  .bill-block p { font-size: 14px; }
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #6b7280; padding: 8px 10px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; }
  tbody td { padding: 12px 10px; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
  .totals { margin-left: auto; width: 260px; }
  .totals .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; color: #374151; }
  .totals .total-row { display: flex; justify-content: space-between; padding: 10px 0 4px; font-size: 16px; font-weight: 700; border-top: 2px solid #111827; margin-top: 6px; }
  .notes-section { margin-top: 32px; padding: 16px; background: #f9fafb; border-radius: 8px; font-size: 13px; color: #374151; }
  .notes-section h4 { font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #9ca3af; margin-bottom: 6px; }
  .footer { margin-top: 48px; text-align: center; font-size: 12px; color: #9ca3af; }
  @media print { @page { margin: 20mm; } body { padding: 0; } }
</style></head>
<body>
<div class="header">
  <div><div class="brand">Riden Technologies</div><div class="brand-sub">AI-Powered Websites &amp; Automation</div></div>
  <div class="inv-meta">
    <div class="inv-number">${inv.number}</div>
    <div class="inv-date">Issued: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
    ${inv.dueDate ? `<div class="inv-date">Due: ${new Date(inv.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>` : ""}
    <div><span class="status-badge ${statusClass}">${inv.status}</span></div>
  </div>
</div>
<div class="bill-section">
  <div class="bill-block">
    <h4>Bill To</h4>
    <p><strong>${inv.clientName}</strong></p>
    ${inv.clientEmail ? `<p style="color:#6b7280">${inv.clientEmail}</p>` : ""}
  </div>
  <div class="bill-block">
    <h4>Payment Details</h4>
    <p>Riden Technologies</p>
    <p style="color:#6b7280">ridentechnologies.com</p>
  </div>
</div>
<hr class="divider">
<table>
  <thead><tr>
    <th style="text-align:left">Description</th>
    <th style="text-align:right">Qty</th>
    <th style="text-align:right">Unit Price</th>
    <th style="text-align:right">Amount</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="totals">
  <div class="row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
  ${inv.taxRate > 0 ? `<div class="row"><span>Tax (${inv.taxRate}%)</span><span>$${taxAmount.toFixed(2)}</span></div>` : ""}
  ${inv.discount > 0 ? `<div class="row"><span>Discount</span><span>-$${inv.discount.toFixed(2)}</span></div>` : ""}
  <div class="total-row"><span>Total Due</span><span>$${total.toFixed(2)}</span></div>
</div>
${inv.notes ? `<div class="notes-section"><h4>Notes</h4><p>${inv.notes}</p></div>` : ""}
<div class="footer">Thank you for your business — Riden Technologies</div>
<script>setTimeout(()=>window.print(),400);</script>
</body></html>`;
}

export default function InvoiceModal({ open, mode, initial, onClose, onSave }: InvoiceModalProps) {
  const defaultForm: InvoiceData = {
    clientName: "", clientEmail: "", dueDate: "", status: "draft",
    taxRate: 0, discount: 0, notes: "",
    lineItems: [{ tempId: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 }],
  };

  const [form, setForm] = useState<InvoiceData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initial) {
        setForm({
          ...defaultForm,
          ...initial,
          lineItems: initial.lineItems && initial.lineItems.length > 0
            ? initial.lineItems.map((li) => ({ ...li, tempId: li.id ?? crypto.randomUUID() }))
            : defaultForm.lineItems,
        });
      } else {
        setForm(defaultForm);
      }
      setError("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  const subtotal = form.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
  const taxAmount = subtotal * form.taxRate / 100;
  const total = Math.max(0, subtotal + taxAmount - form.discount);

  function setField<K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateLineItem(tempId: string, field: keyof Omit<LineItem, "tempId">, value: string | number) {
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.map((li) =>
        li.tempId === tempId ? { ...li, [field]: field === "description" ? value : Number(value) || 0 } : li
      ),
    }));
  }

  function addLineItem() {
    setForm((f) => ({
      ...f,
      lineItems: [...f.lineItems, { tempId: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 }],
    }));
  }

  function removeLineItem(tempId: string) {
    setForm((f) => ({ ...f, lineItems: f.lineItems.filter((li) => li.tempId !== tempId) }));
  }

  async function handleSave(statusOverride?: string) {
    if (!form.clientName.trim()) { setError("Client name is required."); return; }
    setSaving(true); setError("");

    const payload = {
      ...form,
      status: statusOverride ?? form.status,
      lineItems: form.lineItems.filter((li) => li.description.trim()),
      amount: total,
    };

    try {
      const url = mode === "edit" && initial?.id ? `/api/invoices/${initial.id}` : "/api/invoices";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to save invoice.");
        return;
      }
      onSave();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handlePrint() {
    const inv = {
      ...form,
      number: initial?.number ?? "INV-DRAFT",
      amount: total,
    };
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(buildPrintHTML(inv));
    win.document.close();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-3xl glass-card rounded-2xl border border-riden-border my-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-riden-border">
              <h2 className="text-base font-semibold text-white">
                {mode === "create" ? "New Invoice" : `Edit ${initial?.number ?? "Invoice"}`}
              </h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Client + Meta */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Client Name *</label>
                  <input
                    value={form.clientName}
                    onChange={(e) => setField("clientName", e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Client Email</label>
                  <input
                    type="email"
                    value={form.clientEmail}
                    onChange={(e) => setField("clientEmail", e.target.value)}
                    placeholder="client@example.com"
                    className="w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setField("dueDate", e.target.value)}
                    className="w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setField("status", e.target.value)}
                    className="w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="bg-riden-surface capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Line Items</label>
                  <button
                    onClick={addLineItem}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Plus size={12} /> Add row
                  </button>
                </div>

                <div className="bg-riden-surface rounded-xl border border-riden-border overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-riden-border text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2 text-right">Qty</div>
                    <div className="col-span-3 text-right">Unit Price</div>
                    <div className="col-span-1 text-right">Amount</div>
                    <div className="col-span-1" />
                  </div>

                  {form.lineItems.map((li) => (
                    <div key={li.tempId} className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-riden-border/50 items-center">
                      <div className="col-span-5">
                        <input
                          value={li.description}
                          onChange={(e) => updateLineItem(li.tempId, "description", e.target.value)}
                          placeholder="Website design & build"
                          className="w-full bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={li.quantity}
                          onChange={(e) => updateLineItem(li.tempId, "quantity", e.target.value)}
                          className="w-full bg-transparent text-sm text-white text-right focus:outline-none"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={li.unitPrice}
                          onChange={(e) => updateLineItem(li.tempId, "unitPrice", e.target.value)}
                          className="w-full bg-transparent text-sm text-white text-right focus:outline-none"
                        />
                      </div>
                      <div className="col-span-1 text-sm text-slate-400 text-right">
                        {formatCurrency(li.quantity * li.unitPrice)}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => removeLineItem(li.tempId)}
                          className="p-1 rounded hover:bg-riden-muted text-slate-600 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals + Tax/Discount */}
              <div className="grid sm:grid-cols-2 gap-4 items-start">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Tax Rate (%)</label>
                      <input
                        type="number" min="0" max="100" step="0.1"
                        value={form.taxRate}
                        onChange={(e) => setField("taxRate", Number(e.target.value) || 0)}
                        className="w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Discount ($)</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={form.discount}
                        onChange={(e) => setField("discount", Number(e.target.value) || 0)}
                        className="w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setField("notes", e.target.value)}
                      placeholder="Payment terms, additional details..."
                      rows={3}
                      className="w-full bg-riden-muted border border-riden-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 resize-none"
                    />
                  </div>
                </div>

                {/* Totals summary */}
                <div className="bg-riden-surface rounded-xl border border-riden-border p-4 space-y-2">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Subtotal</span><span className="text-white">{formatCurrency(subtotal)}</span>
                  </div>
                  {form.taxRate > 0 && (
                    <div className="flex justify-between text-sm text-slate-400">
                      <span>Tax ({form.taxRate}%)</span><span className="text-white">{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  {form.discount > 0 && (
                    <div className="flex justify-between text-sm text-slate-400">
                      <span>Discount</span><span className="text-rose-400">-{formatCurrency(form.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-white border-t border-riden-border pt-2 mt-2">
                    <span>Total</span><span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-riden-border">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <Printer size={14} /> Print / Save as PDF
              </button>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => handleSave("draft")}
                  disabled={saving}
                >
                  <Save size={14} /> Save Draft
                </Button>
                <Button
                  variant="gradient" size="sm"
                  onClick={() => handleSave(form.status === "draft" ? "sent" : form.status)}
                  disabled={saving}
                >
                  <Send size={14} /> {saving ? "Saving..." : mode === "create" ? "Create Invoice" : "Save Changes"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
