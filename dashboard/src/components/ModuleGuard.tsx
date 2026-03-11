"use client";

/**
 * ModuleGuard — wraps a module page/layout and blocks access if the clinic
 * has not subscribed to that module and is not in an active trial.
 *
 * On access denied: renders LockedModulePage in-place (no redirect).
 * While loading: shows a spinner.
 */

import { Loader2 } from "lucide-react";
import { useEntitlements } from "@/hooks/useEntitlements";
import LockedModulePage from "@/components/LockedModulePage";
import type { ModuleKey } from "@/lib/billing";

interface Props {
  module: ModuleKey;
  children: React.ReactNode;
}

export default function ModuleGuard({ module, children }: Props) {
  const { hasModule, loading } = useEntitlements();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0B2545" }}
      >
        <Loader2 size={28} className="animate-spin text-white/50" />
      </div>
    );
  }

  if (!hasModule(module)) {
    return <LockedModulePage module={module} />;
  }

  return <>{children}</>;
}
