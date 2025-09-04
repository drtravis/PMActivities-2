"use client";

import { usePathname } from "next/navigation";
import ClientAuthProvider from "@/components/ClientAuthProvider";
import { StatusProvider } from "@/contexts/StatusContext";

export default function ClientAppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const skipStatus = pathname.startsWith("/login") || pathname.startsWith("/setup");

  return (
    <ClientAuthProvider>
      {skipStatus ? children : <StatusProvider>{children}</StatusProvider>}
    </ClientAuthProvider>
  );
}

