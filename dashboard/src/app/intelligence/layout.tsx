import type { Metadata } from "next";
import ModuleGuard from "@/components/ModuleGuard";

export const metadata: Metadata = {
  title: "Intelligence",
};

export default function IntelligenceLayout({ children }: { children: React.ReactNode }) {
  return <ModuleGuard module="intelligence">{children}</ModuleGuard>;
}
