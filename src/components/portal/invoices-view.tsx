"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText, Plus, DollarSign, Clock, CheckCircle, AlertCircle, MoreHorizontal, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockInvoices } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusConfig = {
  paid: { label: "Paid", variant: "success", icon: CheckCircle },
  sent: { label: "Sent", variant: "default", icon: Clock },
  overdue: { label: "Overdue", variant: "destructive", icon: AlertCircle },
  draft: { label: "Draft", variant: "secondary", icon: FileText },
} as const;

export default function InvoicesView() {
  const totalPaid = mockInvoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalOutstanding = mockInvoices.filter(i => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const totalOverdue = mockInvoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">Invoices & Billing</h2>
          <p className="text-xs sm:text-sm text-slate-500">{mockInvoices.length} total invoices</p>
        </div>
        <Button variant="gradient" size="sm" className="flex-shrink-0">
          <Plus size={14} />
          <span className="hidden sm:inline">New Invoice</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total Paid", value: formatCurrency(totalPaid), icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Outstanding", value: formatCurrency(totalOutstanding), icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Overdue", value: formatCurrency(totalOverdue), icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
          { label: "This Month", value: formatCurrency(totalPaid + totalOutstanding), icon: DollarSign, color: "text-violet-400", bg: "bg-violet-500/10" },
        ].map((stat, i) => (
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

      {/* Invoice Table — desktop only */}
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
          {mockInvoices.map((invoice) => {
            const config = statusConfig[invoice.status];
            return (
              <div
                key={invoice.id}
                className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors items-center"
              >
                <div className="col-span-2 text-sm font-mono text-blue-400">{invoice.number}</div>
                <div className="col-span-3">
                  <div className="text-sm text-white">{invoice.clientName}</div>
                  <div className="text-xs text-slate-500">{formatDate(invoice.createdAt)}</div>
                </div>
                <div className="col-span-2 text-sm font-semibold text-white">{formatCurrency(invoice.amount)}</div>
                <div className="col-span-2 text-sm text-slate-400">{formatDate(invoice.dueDate)}</div>
                <div className="col-span-2">
                  <Badge variant={config.variant as "default" | "success" | "destructive" | "secondary"}>{config.label}</Badge>
                </div>
                <div className="col-span-1 flex justify-end gap-1">
                  <button className="p-1.5 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
                    <Download size={13} />
                  </button>
                  <button className="p-1.5 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
                    <MoreHorizontal size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Invoice Cards — mobile only */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="md:hidden glass-card rounded-xl border border-riden-border overflow-hidden"
      >
        <div className="divide-y divide-riden-border">
          {mockInvoices.map((invoice) => {
            const config = statusConfig[invoice.status];
            const StatusIcon = config.icon;
            return (
              <div key={invoice.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-sm font-mono text-blue-400 mb-0.5">{invoice.number}</div>
                    <div className="text-sm font-medium text-white">{invoice.clientName}</div>
                    <div className="text-xs text-slate-500">{formatDate(invoice.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={config.variant as "default" | "success" | "destructive" | "secondary"} className="text-[10px]">
                      <StatusIcon size={10} className="mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-bold text-white">{formatCurrency(invoice.amount)}</div>
                    <div className="text-xs text-slate-500">Due {formatDate(invoice.dueDate)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center">
                      <Download size={14} />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
