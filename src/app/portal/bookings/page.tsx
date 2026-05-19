"use client";

import React from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Plus, Video, User, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const bookings = [
  { id: "1", title: "Strategy Call — Acme Corp", client: "Marcus Thompson", time: "10:00 AM", date: "2026-05-20", duration: "30 min", type: "video", status: "confirmed" },
  { id: "2", title: "Onboarding Session", client: "Priya Patel", time: "2:00 PM", date: "2026-05-20", duration: "60 min", type: "video", status: "confirmed" },
  { id: "3", title: "Website Review", client: "RetailEdge Inc.", time: "11:00 AM", date: "2026-05-21", duration: "45 min", type: "video", status: "pending" },
  { id: "4", title: "CRM Demo", client: "New Prospect", time: "3:30 PM", date: "2026-05-22", duration: "30 min", type: "video", status: "confirmed" },
];

const today = bookings.filter(b => b.date === "2026-05-20");
const upcoming = bookings.filter(b => b.date !== "2026-05-20");

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Bookings & Calendar</h2>
          <p className="text-sm text-slate-500">{today.length} appointments today</p>
        </div>
        <Button variant="gradient" size="sm">
          <Plus size={14} />
          New Booking
        </Button>
      </div>

      {/* Today */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Today — May 20, 2026
        </h3>
        <div className="space-y-3">
          {today.map((booking, i) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl border border-blue-500/20 p-4 flex items-center gap-4"
              style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.06), transparent)" }}
            >
              <div className="text-center w-14 flex-shrink-0">
                <div className="text-lg font-bold text-white">{booking.time.split(":")[0]}</div>
                <div className="text-xs text-slate-500">{booking.time.split(" ")[1]}</div>
              </div>
              <div className="w-px h-10 bg-riden-border flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{booking.title}</div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <User size={11} />
                  <span>{booking.client}</span>
                  <span>·</span>
                  <Clock size={11} />
                  <span>{booking.duration}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={booking.status === "confirmed" ? "success" : "warning"} className="text-[10px]">
                  {booking.status}
                </Badge>
                <Button variant="default" size="sm" className="text-xs">
                  <Video size={12} /> Join
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Upcoming */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Upcoming
        </h3>
        <div className="space-y-3">
          {upcoming.map((booking, i) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              className="glass-card rounded-xl border border-riden-border p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-riden-muted border border-riden-border flex items-center justify-center flex-shrink-0">
                <Calendar size={16} className="text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{booking.title}</div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span>{booking.date}</span>
                  <span>·</span>
                  <span>{booking.time}</span>
                  <span>·</span>
                  <span>{booking.duration}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={booking.status === "confirmed" ? "success" : "warning"} className="text-[10px]">
                  {booking.status}
                </Badge>
                <button className="p-1 rounded hover:bg-riden-muted text-slate-500 hover:text-white transition-colors">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
