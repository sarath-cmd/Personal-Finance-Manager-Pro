"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar, { DEFAULT_SIDEBAR_WIDTH, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH } from "./Sidebar";
import Topbar from "./Topbar";
import QuickActionsFab from "./QuickActionsFab";

const STORAGE_KEY = "pfm-sidebar-width";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const pathname = usePathname();

  // Restore the saved width after mount (avoids an SSR/client hydration mismatch).
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(STORAGE_KEY));
      if (saved && saved >= MIN_SIDEBAR_WIDTH && saved <= MAX_SIDEBAR_WIDTH) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from browser storage, not derivable from render
        setSidebarWidth(saved);
      }
    } catch {
      // localStorage unavailable (private mode, etc.) — fall back to the default width.
    }
  }, []);

  function handleResize(width: number) {
    setSidebarWidth(width);
    try {
      localStorage.setItem(STORAGE_KEY, String(width));
    } catch {
      // ignore
    }
  }

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing drawer state to navigation, not render-derived state
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen" style={{ "--sidebar-width": `${sidebarWidth}px` } as React.CSSProperties}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        width={sidebarWidth}
        onResize={handleResize}
      />
      <div className="app-content min-h-screen flex flex-col app-bg">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="p-4 sm:p-6 lg:p-8 flex-1 min-w-0">{children}</div>
      </div>
      <QuickActionsFab />
    </div>
  );
}
