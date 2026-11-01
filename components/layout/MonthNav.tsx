"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getActiveMonth, monthLabel, shiftMonth } from "@/lib/month";

export default function MonthNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const monthParam = searchParams.get("month");
  const activeMonth = getActiveMonth(monthParam);
  const isCurrentMonth = !monthParam;

  function goTo(month: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (month) {
      params.set("month", month);
    } else {
      params.delete("month");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex items-center gap-3 font-bold text-sm text-text-primary whitespace-nowrap">
      <button
        type="button"
        className="month-btn"
        onClick={() => goTo(shiftMonth(activeMonth, -1))}
        aria-label="Previous month"
      >
        ‹
      </button>
      <span>{monthLabel(activeMonth)}</span>
      <button
        type="button"
        className="month-btn"
        onClick={() => goTo(shiftMonth(activeMonth, 1))}
        aria-label="Next month"
      >
        ›
      </button>
      {!isCurrentMonth && (
        <button
          type="button"
          className="btn btn-secondary py-1.5 px-3 text-xs"
          onClick={() => goTo(null)}
        >
          Today
        </button>
      )}
    </div>
  );
}
