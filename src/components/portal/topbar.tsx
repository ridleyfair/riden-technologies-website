"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageLabels: Record<string, string> = {
  "/portal/dashboard": "Dashboard",
  "/portal/clients": "Clients",
  "/portal/leads": "Leads",
  "/portal/projects": "Projects",
  "/portal/websites": "Websites",
  "/portal/bookings": "Bookings",
  "/portal/automation": "Automation",
  "/portal/analytics": "Analytics",
  "/portal/invoices": "Invoices",
  "/portal/team": "Team",
  "/portal/settings": "Settings",
};

interface TopbarProps {
  onMobileMenuToggle?: () => void;
}

export default function Topbar({ onMobileMenuToggle }: TopbarProps) {
  const pathname = usePathname();
  const label = pageLabels[pathname] ?? "Portal";

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-riden-border bg-riden-darker/80 backdrop-blur-sm">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu button */}
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-riden-muted transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-white truncate">{label}</h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            className="w-56 bg-riden-muted border border-riden-border rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 bg-riden-surface px-1.5 py-0.5 rounded border border-riden-border font-mono">
            ⌘K
          </kbd>
        </div>

        {/* New Button */}
        <Button variant="default" size="sm" className="hidden sm:flex">
          <Plus size={14} />
          New
        </Button>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-lg bg-riden-muted border border-riden-border flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500/50 transition-all">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-400" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white cursor-pointer hover:opacity-90 transition-opacity">
          A
        </div>
      </div>
    </div>
  );
}
