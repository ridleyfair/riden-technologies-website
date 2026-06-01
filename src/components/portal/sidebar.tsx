"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FolderKanban,
  Globe,
  Calendar,
  Zap,
  BarChart3,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  Sparkles,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";

const navItems = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    section: "CRM",
    items: [
      { label: "Leads", href: "/portal/leads", icon: UserPlus },
      { label: "Possible Clients", href: "/portal/possible-clients", icon: Flame },
      { label: "Bookings", href: "/portal/bookings", icon: Calendar },
      { label: "Clients", href: "/portal/clients", icon: Users },
    ],
  },
  {
    section: "Projects",
    items: [
      { label: "Projects", href: "/portal/projects", icon: FolderKanban },
    ],
  },
  {
    section: "Tools",
    items: [
      { label: "Websites", href: "/portal/websites", icon: Globe },
      { label: "Studio", href: "/portal/studio", icon: Sparkles },
      { label: "Automation", href: "/portal/automation", icon: Zap },
      { label: "Analytics", href: "/portal/analytics", icon: BarChart3 },
    ],
  },
  {
    section: "Admin",
    items: [
      { label: "Invoices", href: "/portal/invoices", icon: FileText },
      { label: "Team", href: "/portal/team", icon: Shield },
      { label: "Settings", href: "/portal/settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose?: () => void;
}

export default function Sidebar({ collapsed, onToggle, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => null);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex-shrink-0 h-screen bg-riden-darker border-r border-riden-border flex flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center px-4 py-5 border-b border-riden-border min-h-[65px] overflow-hidden">
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-glow">
            <span className="text-white text-sm font-bold">R</span>
          </div>
        ) : (
          <div
            style={{
              width: "210px",
              height: "64px",
              backgroundImage: theme === "light"
                ? "url(/images/blackridenlogo.png)"
                : "url(/images/RidenLogo.png)",
              backgroundSize: theme === "light" ? "contain" : "200% auto",
              backgroundPosition: theme === "light" ? "center center" : "left center",
              backgroundRepeat: "no-repeat",
              flexShrink: 0,
              mixBlendMode: theme === "light" ? "multiply" : "normal",
            }}
            aria-label="Riden Technologies"
          />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 portal-scroll">
        {navItems.map((group) => (
          <div key={group.section} className="mb-4">
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1"
                >
                  {group.section}
                </motion.p>
              )}
            </AnimatePresence>
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  onClick={onMobileClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                    isActive
                      ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                      : "text-slate-500 hover:text-white hover:bg-riden-muted"
                  )}
                >
                  <item.icon
                    size={17}
                    className={cn(
                      "flex-shrink-0",
                      isActive ? "text-blue-400" : "text-slate-500 group-hover:text-white"
                    )}
                  />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-r-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-riden-border p-3">
        <div className={cn("flex items-center gap-3 rounded-lg p-2", !collapsed && "hover:bg-riden-muted transition-colors")}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 min-w-0"
              >
                <div className="text-xs font-medium text-white truncate">{user?.name ?? "Loading..."}</div>
                <div className="text-[10px] text-slate-500 truncate">{user?.email ?? ""}</div>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <button onClick={handleLogout} title="Sign out">
              <LogOut size={14} className="text-slate-500 hover:text-rose-400 transition-colors flex-shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse Toggle - desktop only */}
      <button
        onClick={onToggle}
        className="hidden md:flex absolute top-5 -right-3.5 w-7 h-7 rounded-full bg-riden-surface border-2 border-riden-border shadow-lg items-center justify-center text-slate-300 hover:text-white hover:border-blue-500 hover:bg-riden-muted transition-all duration-200 z-20"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
