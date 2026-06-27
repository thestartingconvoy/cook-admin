"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BackLink({ href, label = "Back" }: { href: string; label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function go() {
    if (loading) return;
    setLoading(true);
    router.push(href);
  }

  return (
    <button
      onClick={go}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/80 disabled:cursor-wait disabled:opacity-60"
    >
      {loading ? (
        <>
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Going back…</span>
        </>
      ) : (
        <>
          <span>←</span>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
