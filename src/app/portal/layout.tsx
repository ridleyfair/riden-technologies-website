"use client";

import React, { useState } from "react";
import Sidebar from "@/components/portal/sidebar";
import Topbar from "@/components/portal/topbar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-riden-dark overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto portal-scroll p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
