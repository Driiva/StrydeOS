import type { Metadata } from "next";
import ModuleGuard from "@/components/ModuleGuard";

export const metadata: Metadata = {
  title: "Pulse",
};

export default function ContinuityLayout({ children }: { children: React.ReactNode }) {
  return <ModuleGuard module="pulse">{children}</ModuleGuard>;
}
