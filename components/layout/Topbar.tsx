"use client";

import { Suspense } from "react";
import { signOut, useSession } from "next-auth/react";
import MonthNav from "./MonthNav";

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { data: session } = useSession();
  const initials = (session?.user?.name || session?.user?.email || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="topbar sticky top-0 z-20 flex items-center gap-2 sm:gap-4 px-3 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex-wrap">
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden icon-chip flex-shrink-0"
        aria-label="Open menu"
      >
        ☰
      </button>

      <Suspense>
        <MonthNav />
      </Suspense>

      <div className="flex-1" />

      <div className="hidden sm:block text-sm text-text-secondary truncate max-w-[160px]">
        {session?.user?.name || session?.user?.email}
      </div>
      <button
        type="button"
        className="btn btn-secondary py-1.5 px-3 text-xs"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <span className="hidden sm:inline">Sign out</span>
        <span className="sm:hidden">⏻</span>
      </button>
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-light to-primary-dark text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0">
        {initials}
      </div>
    </div>
  );
}
