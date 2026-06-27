"use client";

import { useEffect, useRef, useState } from "react";

type Platform = "android" | "ios";

const STORAGE_KEY = "meal-plan-install-dismissed";
const AUTO_DISMISS_MS = 5000;

export function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deferredRef = useRef<any>(null);

  useEffect(() => {
    // Already installed as standalone app
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone)
    ) return;

    // Already dismissed recently
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    const ua = navigator.userAgent;
    const isIOS =
      /iPhone|iPad|iPod/.test(ua) &&
      !/(Chrome\/|CriOS\/|FxiOS\/)/.test(ua); // Safari only
    const isAndroid = /Android/.test(ua);

    if (!isIOS && !isAndroid) return;

    if (isIOS) {
      setPlatform("ios");
      setVisible(true);
      return;
    }

    // Android: wait for the browser's beforeinstallprompt event
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      deferredRef.current = e;
      setPlatform("android");
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  // Progress bar + auto-dismiss
  useEffect(() => {
    if (!visible) return;
    const start = Date.now();

    const tick = setInterval(() => {
      const pct = Math.max(0, 100 - ((Date.now() - start) / AUTO_DISMISS_MS) * 100);
      setProgress(pct);
      if (pct === 0) dismiss();
    }, 40);

    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }

  async function install() {
    if (deferredRef.current) {
      deferredRef.current.prompt();
      const { outcome } = await deferredRef.current.userChoice;
      if (outcome === "accepted") dismiss();
    } else {
      dismiss();
    }
  }

  if (!visible || !platform) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
      {/* Auto-dismiss progress bar */}
      <div className="mb-2.5 h-px overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full bg-white/25"
          style={{ width: `${progress}%`, transition: "width 40ms linear" }}
        />
      </div>

      <div
        className="rounded-2xl border border-white/10 p-4 shadow-2xl"
        style={{ background: "rgba(14,14,14,0.97)", backdropFilter: "blur(20px)" }}
      >
        <div className="flex items-center gap-3.5">
          {/* App icon */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/app-icon?size=96"
            alt="Meal Plan"
            width={44}
            height={44}
            className="shrink-0 rounded-xl"
          />

          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold tracking-tight">Meal Plan</p>
            {platform === "ios" ? (
              <p className="mt-0.5 text-[12px] leading-snug text-white/45">
                Tap <span className="text-white/65">Share</span>
                {" → "}
                <span className="text-white/65">Add to Home Screen</span>
              </p>
            ) : (
              <p className="mt-0.5 text-[12px] text-white/45">Add to your home screen</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={dismiss}
              className="rounded-lg px-3 py-1.5 text-[12px] text-white/35 transition hover:text-white/65"
            >
              Skip
            </button>
            {platform === "android" && (
              <button
                onClick={install}
                className="rounded-xl bg-white px-4 py-1.5 text-[12px] font-semibold text-black transition hover:bg-white/90"
              >
                Install
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
