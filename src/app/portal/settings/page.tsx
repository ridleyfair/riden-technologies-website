"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Bell, Shield, CreditCard, Globe, Key, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "integrations", label: "Integrations", icon: Globe },
  { id: "api", label: "API Keys", icon: Key },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");

  return (
    <div className="flex gap-6 h-full">
      {/* Settings Nav */}
      <div className="w-52 flex-shrink-0">
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                activeSection === section.id
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                  : "text-slate-500 hover:text-white hover:bg-riden-muted"
              }`}
            >
              <section.icon size={16} />
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 glass-card rounded-xl border border-riden-border p-6 space-y-6"
      >
        {activeSection === "profile" && (
          <>
            <div>
              <h3 className="text-base font-semibold text-white mb-1">Profile Settings</h3>
              <p className="text-xs text-slate-500">Update your personal information and preferences.</p>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xl font-bold text-white">
                A
              </div>
              <div>
                <Button variant="outline" size="sm">Change Photo</Button>
                <p className="text-xs text-slate-500 mt-1">JPG, PNG or GIF. Max 2MB.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {[
                { label: "First Name", value: "Admin" },
                { label: "Last Name", value: "User" },
                { label: "Email Address", value: "admin@ridentech.com" },
                { label: "Phone", value: "+1 (555) 000-0000" },
              ].map((field, i) => (
                <div key={i}>
                  <label className="block text-sm text-slate-400 mb-2">{field.label}</label>
                  <input
                    defaultValue={field.value}
                    className="w-full bg-riden-muted border border-riden-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Company Name</label>
              <input
                defaultValue="Riden Technologies"
                className="w-full bg-riden-muted border border-riden-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>

            <div className="flex justify-end">
              <Button variant="gradient">
                <Save size={14} /> Save Changes
              </Button>
            </div>
          </>
        )}

        {activeSection === "notifications" && (
          <>
            <div>
              <h3 className="text-base font-semibold text-white mb-1">Notification Preferences</h3>
              <p className="text-xs text-slate-500">Choose when and how you receive notifications.</p>
            </div>
            <div className="space-y-4">
              {[
                { label: "New Lead Notification", desc: "Get notified when a new lead is added", enabled: true },
                { label: "Automation Alerts", desc: "Alerts when automations fail or complete", enabled: true },
                { label: "Invoice Reminders", desc: "Reminders for overdue or upcoming invoices", enabled: true },
                { label: "Team Activity", desc: "Updates on team member actions", enabled: false },
                { label: "Weekly Reports", desc: "Receive weekly performance summary emails", enabled: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-riden-border last:border-0">
                  <div>
                    <div className="text-sm text-white">{item.label}</div>
                    <div className="text-xs text-slate-500">{item.desc}</div>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors cursor-pointer flex items-center px-1 ${item.enabled ? "bg-blue-600" : "bg-riden-muted border border-riden-border"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${item.enabled ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeSection !== "profile" && activeSection !== "notifications" && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-riden-muted border border-riden-border flex items-center justify-center mb-4">
              {React.createElement(sections.find(s => s.id === activeSection)?.icon ?? User, { size: 20, className: "text-slate-400" })}
            </div>
            <div className="text-sm font-medium text-white mb-2">
              {sections.find(s => s.id === activeSection)?.label} Settings
            </div>
            <div className="text-xs text-slate-500">Coming soon — this section is under development.</div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
