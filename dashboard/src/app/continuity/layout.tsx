import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pulse",
};

export default function ContinuityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
