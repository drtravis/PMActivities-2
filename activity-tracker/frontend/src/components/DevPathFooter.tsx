"use client";

import { useEffect, useState } from "react";

export default function DevPathFooter() {
  const [cwd, setCwd] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Temporarily disabled to fix infinite loop
    setCwd('DevPathFooter temporarily disabled');
    // let cancelled = false;
    // async function load() {
    //   try {
    //     const res = await fetch("/api/dev/cwd", { cache: "no-store" });
    //     if (!res.ok) throw new Error(`HTTP ${res.status}`);
    //     const data = await res.json();
    //     if (!cancelled) setCwd(data.cwd || "(unknown)");
    //   } catch (e: any) {
    //     if (!cancelled) setError(e?.message || "Failed to fetch cwd");
    //   }
    // }
    // load();
    // return () => { cancelled = true };
  }, []);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-2 right-2 z-[9999] max-w-[60vw]">
      <div className="backdrop-blur bg-black/60 text-white text-xs md:text-sm rounded px-2.5 py-1.5 shadow-lg border border-white/10">
        <span className="font-semibold">Dev</span>: Serving from
        <span className="ml-1 font-mono break-all">{cwd || error || "loading..."}</span>
      </div>
    </div>
  );
}

