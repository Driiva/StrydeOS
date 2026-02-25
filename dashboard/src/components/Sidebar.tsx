"use client";

import { useState } from "react";
import { LogoNav } from "@/components/MonolithLogo";
import { colors } from "@/lib/brand";

const NAV_ITEMS = [
  { label: "Dashboard", icon: DashboardIcon, href: "/" },
  { label: "Scorecard", icon: ScorecardIcon, href: "#scorecard" },
  { label: "Trends", icon: TrendsIcon, href: "#trends" },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden rounded-lg bg-white p-2 shadow-md border border-cloud-dark"
        aria-label="Toggle menu"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          {mobileOpen ? (
            <path d="M5 5L15 15M15 5L5 15" stroke={colors.ink} strokeWidth="1.5" strokeLinecap="round" />
          ) : (
            <path d="M3 5h14M3 10h14M3 15h14" stroke={colors.ink} strokeWidth="1.5" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-60 bg-white border-r border-cloud-dark flex flex-col transition-transform duration-200 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="px-6 py-6 border-b border-cloud-dark">
          <LogoNav theme="light" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-muted hover:text-ink hover:bg-cloud-light transition-colors"
            >
              <item.icon />
              {item.label}
            </a>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-cloud-dark">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-cloud-light flex items-center justify-center text-[11px] font-semibold text-muted">
              SO
            </div>
            <div>
              <p className="text-[13px] font-medium text-ink">StrydeOS</p>
              <p className="text-[11px] text-muted">Admin</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted">
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ScorecardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted">
      <path d="M2 8h3M6.5 4v8M11 6h3M11 10h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TrendsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted">
      <path d="M2 12L6 7L10 9L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
