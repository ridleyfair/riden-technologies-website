"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

export default function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    params.then(({ token }) =>
      fetch(`/api/interest-forms/${token}/opt-out`, { method: "POST" })
        .then((r) => setStatus(r.ok ? "done" : "error"))
        .catch(() => setStatus("error"))
    );
  }, [params]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {status === "loading" && <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />}
        {status === "done" && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-slate-900 mb-2">You've been unsubscribed</h1>
            <p className="text-slate-500 text-sm">We've removed you from our outreach list. You won't hear from us again regarding this.</p>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-xl font-semibold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-slate-500 text-sm">Please reply directly to our email to request removal and we'll sort it immediately.</p>
          </>
        )}
        <p className="mt-6 text-xs text-slate-400">Riden Technologies · ridentechnologies.com</p>
      </div>
    </div>
  );
}
