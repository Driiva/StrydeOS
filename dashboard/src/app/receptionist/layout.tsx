import type { Metadata } from "next";
import ModuleGuard from "@/components/ModuleGuard";

export const metadata: Metadata = {
  title: "Ava",
};

export default function ReceptionistLayout({ children }: { children: React.ReactNode }) {
  return <ModuleGuard module="ava">{children}</ModuleGuard>;
}
