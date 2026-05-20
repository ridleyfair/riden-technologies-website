"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/portal/sidebar";
import Topbar from "@/components/portal/topbar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // Run migrations silently on portal load — all steps use IF NOT EXISTS, safe to repeat
    fetch("/api/migrate", { method: "POST" }).catch(() => null);
  }, []);

  return (
    <div className="flex h-screen bg-riden-dark overflow-hidden">
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar wrapper — fixed overlay on mobile, inline on desktop */}
      <div
        className={[
          "fixed md:relative inset-y-0 left-0 z-50 md:z-auto",
          "transition-transform duration-300 ease-in-out md:translate-x-0",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="flex-1 overflow-y-auto portal-scroll p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
