"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send, Search, MoreHorizontal, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const conversations = [
  { id: "1", name: "Marcus Thompson", company: "Acme Corp", lastMessage: "Can we schedule a demo for next week?", time: "2m ago", unread: 2, avatar: "MT", gradient: "from-blue-500 to-violet-600" },
  { id: "2", name: "Priya Patel", company: "TechStart Inc", lastMessage: "The website looks amazing! When do we go live?", time: "1h ago", unread: 0, avatar: "PP", gradient: "from-violet-500 to-pink-500" },
  { id: "3", name: "Sarah Chen", company: "Nexus Properties", lastMessage: "Invoice received, payment pending.", time: "3h ago", unread: 1, avatar: "SC", gradient: "from-emerald-500 to-cyan-500" },
  { id: "4", name: "David Kim", company: "Kim Law Group", lastMessage: "Everything is working perfectly!", time: "1d ago", unread: 0, avatar: "DK", gradient: "from-amber-500 to-orange-500" },
];

const messages = [
  { id: "1", sender: "Marcus Thompson", text: "Hi! I'm very interested in your website generation service.", time: "10:00 AM", isMe: false },
  { id: "2", sender: "Me", text: "Thanks for reaching out Marcus! I'd love to show you what we can do. Would you be free for a quick 30-min call?", time: "10:05 AM", isMe: true },
  { id: "3", sender: "Marcus Thompson", text: "Absolutely! How about Tuesday at 2pm?", time: "10:08 AM", isMe: false },
  { id: "4", sender: "Me", text: "Perfect, I'll send a calendar invite right now!", time: "10:10 AM", isMe: true },
  { id: "5", sender: "Marcus Thompson", text: "Can we schedule a demo for next week?", time: "10:12 AM", isMe: false },
];

export default function MessagesPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const active = selected ? conversations.find(c => c.id === selected) : null;

  const handleSelectConvo = (id: string) => setSelected(id);
  const handleBack = () => setSelected(null);

  return (
    <div className="h-[calc(100vh-130px)] flex gap-5">
      {/* Conversation list — always visible on desktop, shown on mobile only when no convo selected */}
      <div className={`
        w-full md:w-72 md:flex-shrink-0 glass-card rounded-xl border border-riden-border overflow-hidden flex flex-col
        ${selected ? "hidden md:flex" : "flex"}
      `}>
        <div className="p-4 border-b border-riden-border">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              placeholder="Search messages..."
              className="w-full bg-riden-muted border border-riden-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto portal-scroll">
          {conversations.map((convo) => (
            <button
              key={convo.id}
              onClick={() => handleSelectConvo(convo.id)}
              className={`w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors border-b border-riden-border/50 ${selected === convo.id ? "bg-blue-600/5" : ""}`}
            >
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${convo.gradient} flex items-center justify-center text-xs font-bold text-white flex-shrink-0 relative`}>
                {convo.avatar}
                {convo.unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-[9px] font-bold text-white flex items-center justify-center">
                    {convo.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium text-white">{convo.name}</span>
                  <span className="text-[10px] text-slate-600 flex-shrink-0 ml-2">{convo.time}</span>
                </div>
                <div className="text-xs text-slate-500 truncate">{convo.lastMessage}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat panel — always visible on desktop, shown on mobile only when convo selected */}
      <div className={`
        flex-1 glass-card rounded-xl border border-riden-border overflow-hidden flex-col
        ${selected ? "flex" : "hidden md:flex"}
      `}>
        {active ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-riden-border">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="md:hidden p-1.5 rounded-lg hover:bg-riden-muted text-slate-400 hover:text-white transition-colors mr-1 min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <ArrowLeft size={16} />
                </button>
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${active.gradient} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                  {active.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{active.name}</div>
                  <div className="text-xs text-slate-500">{active.company}</div>
                </div>
              </div>
              <button className="p-2 rounded-lg hover:bg-riden-muted text-slate-500 hover:text-white transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center">
                <MoreHorizontal size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto portal-scroll p-4 sm:p-5 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] sm:max-w-xs lg:max-w-sm rounded-2xl px-4 py-2.5 ${msg.isMe ? "bg-blue-600 text-white" : "bg-riden-muted border border-riden-border text-slate-300"}`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${msg.isMe ? "text-blue-200" : "text-slate-600"}`}>{msg.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 sm:p-4 border-t border-riden-border flex items-center gap-2 sm:gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setInput("")}
                placeholder="Type a message..."
                className="flex-1 bg-riden-muted border border-riden-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors min-h-[44px]"
              />
              <Button variant="default" size="icon" onClick={() => setInput("")} className="flex-shrink-0 min-h-[44px] min-w-[44px]">
                <Send size={16} />
              </Button>
            </div>
          </>
        ) : (
          /* Desktop empty state when nothing selected */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-12 h-12 rounded-xl bg-riden-muted border border-riden-border flex items-center justify-center mb-4">
              <Send size={20} className="text-slate-500" />
            </div>
            <p className="text-sm font-medium text-white mb-1">Select a conversation</p>
            <p className="text-xs text-slate-500">Choose a contact from the list to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
