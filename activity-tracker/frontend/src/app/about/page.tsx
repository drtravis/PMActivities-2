"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import appConfig from "@/config/app.config";
import { systemAPI } from "@/lib/api";

export default function AboutPage() {
  const [backend, setBackend] = useState<null | { status: string; timestamp: string; environment?: string; version?: string }>(null);
  const [error, setError] = useState<string | null>(null);

  const frontendVersion = appConfig.app.version;
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev";
  const subBuild = process.env.NEXT_PUBLIC_BUILD_NUM || "0";

  useEffect(() => {
    (async () => {
      try {
        const data = await systemAPI.health();
        setBackend(data as any);
      } catch (e: any) {
        setError(e?.message || "Failed to reach backend");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-xl font-semibold mb-4">About / Build Info</h1>
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <span className="font-medium">Frontend Version:</span> {frontendVersion}
          </div>
          <div>
            <span className="font-medium">Build:</span> {frontendVersion}.{subBuild}.{buildId}
          </div>
          <div>
            <span className="font-medium">API Base URL:</span> {appConfig.api.baseUrl}
          </div>
          <div>
            <span className="font-medium">Env:</span> {appConfig.environment.nodeEnv}
          </div>
        </div>

        <div className="mt-6 p-4 rounded border bg-gray-50">
          <h2 className="font-medium mb-2">Backend Health</h2>
          {!backend && !error && <div className="text-sm text-gray-500">Loading…</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {backend && (
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Status:</span> {backend.status}</div>
              {backend.environment && (
                <div><span className="font-medium">Env:</span> {backend.environment}</div>
              )}
              {backend.version && (
                <div><span className="font-medium">Backend Version:</span> {backend.version}</div>
              )}
              <div><span className="font-medium">Timestamp:</span> {backend.timestamp}</div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link href="/" className="text-blue-600 text-sm underline">Back to app</Link>
        </div>
      </div>
    </div>
  );
}

