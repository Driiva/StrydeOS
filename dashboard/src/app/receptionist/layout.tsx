import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ava",
};

export default function ReceptionistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
