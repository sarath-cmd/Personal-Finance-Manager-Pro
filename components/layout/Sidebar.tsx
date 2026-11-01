"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const DEFAULT_SIDEBAR_WIDTH = 260;
export const MIN_SIDEBAR_WIDTH = 200;
export const MAX_SIDEBAR_WIDTH = 420;

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", icon: "📊", text: "Dashboard", color: "#0e7c66" },
      { href: "/today", icon: "☀️", text: "Today", color: "#f59e0b" },
      { href: "/calendar", icon: "📅", text: "Calendar", color: "#8b5cf6" },
      { href: "/snapshot", icon: "🖼️", text: "Financial Snapshot", color: "#0891b2" },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/accounts", icon: "🏦", text: "Accounts", color: "#0891b2" },
      { href: "/transactions", icon: "📜", text: "Transactions", color: "#8b5cf6" },
      { href: "/income", icon: "💵", text: "Income", color: "#059669" },
      { href: "/expenses", icon: "🧾", text: "Expenses", color: "#dc2626" },
      { href: "/cashflow", icon: "💹", text: "Cash Flow", color: "#0e7c66" },
      { href: "/tags", icon: "🏷️", text: "Tags", color: "#ec4899" },
    ],
  },
  {
    label: "Budget",
    items: [
      { href: "/budget", icon: "📋", text: "Monthly Budget", color: "#c9a15a" },
      { href: "/budget/categories", icon: "🏷️", text: "Budget Categories", color: "#c9a15a" },
    ],
  },
  {
    label: "Bills",
    items: [{ href: "/bills", icon: "📑", text: "Bills", color: "#dc2626" }],
  },
  {
    label: "Savings",
    items: [
      { href: "/savings", icon: "🐷", text: "Savings", color: "#059669" },
      { href: "/savings/goals", icon: "🎯", text: "Savings Goals", color: "#059669" },
    ],
  },
  {
    label: "Lending",
    items: [{ href: "/lending", icon: "🤝", text: "Lent & Borrowed", color: "#c9a15a" }],
  },
  {
    label: "Wealth",
    items: [{ href: "/debt", icon: "💳", text: "Debt Payoff", color: "#8b5cf6" }],
  },
  {
    label: "System",
    items: [{ href: "/settings", icon: "⚙️", text: "Settings", color: "#64748b" }],
  },
];

export default function Sidebar({
  open,
  onClose,
  width,
  onResize,
}: {
  open: boolean;
  onClose: () => void;
  width: number;
  onResize: (width: number) => void;
}) {
  const pathname = usePathname() ?? "";
  const [dragging, setDragging] = useState(false);
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null);

  // Pick the single best (longest-prefix) match so e.g. "/budget/categories"
  // doesn't also light up the "/budget" link.
  const allHrefs = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));
  const bestMatch = allHrefs
    .filter((href) => pathname === href || pathname.startsWith(href + "/"))
    .sort((a, b) => b.length - a.length)[0];

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragState.current) return;
      const delta = e.clientX - dragState.current.startX;
      const next = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, dragState.current.startWidth + delta));
      onResize(next);
    },
    [onResize]
  );

  const stopDragging = useCallback(() => {
    dragState.current = null;
    setDragging(false);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [dragging, handlePointerMove, stopDragging]);

  function startDragging(e: React.PointerEvent) {
    dragState.current = { startX: e.clientX, startWidth: width };
    setDragging(true);
  }

  return (
    <>
      {/* Backdrop — mobile/tablet only, shown while the drawer is open */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={`sidebar h-screen fixed left-0 top-0 flex flex-col z-40 w-[260px] lg:w-(--sidebar-width) ${
          dragging ? "" : "transition-transform duration-200 ease-out"
        } ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="px-6 py-7 border-b border-white/10 relative overflow-hidden">
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: "linear-gradient(90deg, #14a085, #c9a15a, #0891b2)" }}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl drop-shadow-[0_0_12px_rgba(201,161,90,0.5)] flex-shrink-0">💰</span>
              <div className="min-w-0">
                <span className="font-extrabold tracking-tight truncate">Personal Finance</span>
                <span className="ml-2 text-[0.625rem] font-extrabold bg-gradient-to-br from-gold-light to-gold-dark text-[#2a1f0c] px-2 py-0.5 rounded-md">
                  Pro
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden text-white/60 hover:text-white text-xl leading-none flex-shrink-0"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
          <div className="text-[0.6875rem] text-white/45 mt-2 uppercase tracking-wide truncate">
            Income • Expenses • Accounts • Lending
          </div>
        </div>
        <div className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <div className="text-[0.6875rem] font-extrabold text-white/35 uppercase tracking-widest px-2.5 mb-1.5 truncate">
                {group.label}
              </div>
              <ul>
                {group.items.map((item) => {
                  const active = item.href === bestMatch;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`nav-link ${active ? "active" : ""}`}
                      >
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                          style={
                            active
                              ? undefined
                              : { background: `${item.color}26`, boxShadow: `inset 0 0 0 1px ${item.color}40` }
                          }
                        >
                          {item.icon}
                        </span>
                        <span className="flex-1 truncate">{item.text}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Drag-to-resize handle — desktop only, where the sidebar is a static column. */}
        <div
          className={`sidebar-resize-handle hidden lg:block ${dragging ? "active" : ""}`}
          onPointerDown={startDragging}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
        />
      </div>
    </>
  );
}
