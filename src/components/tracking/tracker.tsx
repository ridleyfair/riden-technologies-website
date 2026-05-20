"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getDevice(): string {
  const ua = navigator.userAgent;
  if (/Mobile|Android|iPhone/.test(ua)) return "mobile";
  if (/iPad|Tablet/.test(ua)) return "tablet";
  return "desktop";
}

function getOrCreate(key: string, store: Storage): string {
  let id = store.getItem(key);
  if (!id) { id = crypto.randomUUID(); store.setItem(key, id); }
  return id;
}

function send(data: Record<string, unknown>) {
  if (navigator.doNotTrack === "1") return;
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    keepalive: true,
  }).catch(() => {});
}

export default function Tracker() {
  const pathname = usePathname();
  const sessionRef = useRef("");
  const visitorRef = useRef("");
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      visitorRef.current = getOrCreate("_rid_vid", localStorage);
      sessionRef.current = getOrCreate("_rid_sid", sessionStorage);
    } catch { return; }

    // Heartbeat every 30 s — keeps ActiveSession updated for live visitor count
    heartbeatRef.current = setInterval(() => {
      send({
        type: "heartbeat",
        path: window.location.pathname,
        sessionId: sessionRef.current,
        visitorId: visitorRef.current,
        device: getDevice(),
      });
    }, 30_000);

    // Track form submissions on public pages
    const handleSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement;
      if (!form) return;
      send({
        type: "form_submit",
        path: window.location.pathname,
        sessionId: sessionRef.current,
        visitorId: visitorRef.current,
        device: getDevice(),
        metadata: { formId: form.id || form.className || "unknown" },
      });
    };
    document.addEventListener("submit", handleSubmit, true);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      document.removeEventListener("submit", handleSubmit, true);
    };
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (!visitorRef.current) return;
    const params = new URLSearchParams(window.location.search);
    send({
      type: "page_view",
      path: pathname,
      referrer: document.referrer || undefined,
      source: params.get("utm_source") || undefined,
      medium: params.get("utm_medium") || undefined,
      campaign: params.get("utm_campaign") || undefined,
      device: getDevice(),
      sessionId: sessionRef.current,
      visitorId: visitorRef.current,
    });
  }, [pathname]);

  return null;
}
