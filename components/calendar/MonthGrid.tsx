"use client";

import { formatCurrency } from "@/lib/constants";

export type CalendarItem = {
  id: string;
  date: string;
  title: string;
  subtitle?: string;
  amount?: number;
  kind: "bill" | "subscription" | "income" | "debt" | "task" | "event";
  done?: boolean;
};

const KIND_COLORS: Record<CalendarItem["kind"], string> = {
  bill: "var(--danger-light)",
  subscription: "var(--info)",
  income: "var(--success)",
  debt: "#8b5cf6",
  task: "var(--gold-dark)",
  event: "var(--text-tertiary)",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MonthGrid({ month, items }: { month: string; items: CalendarItem[] }) {
  const [year, m] = month.split("-").map(Number);
  const firstOfMonth = new Date(Date.UTC(year, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const startWeekday = firstOfMonth.getUTCDay();
  const todayStr = new Date().toISOString().slice(0, 10);

  const itemsByDate = new Map<string, CalendarItem[]>();
  for (const item of items) {
    if (!itemsByDate.has(item.date)) itemsByDate.set(item.date, []);
    itemsByDate.get(item.date)!.push(item);
  }

  const cells: { date: string | null; day: number | null }[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ date: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ date, day: d });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, day: null });

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-[0.65rem] font-extrabold uppercase tracking-wide text-text-tertiary pb-1">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell, i) => {
            if (!cell.date) {
              return <div key={i} className="min-h-[88px] rounded-lg bg-light-bg/40" />;
            }
            const dayItems = itemsByDate.get(cell.date) ?? [];
            const isToday = cell.date === todayStr;
            return (
              <div
                key={i}
                className={`min-h-[88px] rounded-lg border p-1.5 flex flex-col gap-1 ${
                  isToday ? "border-gold-dark" : "border-border-color"
                } bg-card-bg`}
                style={isToday ? { boxShadow: "0 0 0 1px var(--gold-dark)" } : undefined}
              >
                <div className="text-xs font-bold text-text-secondary">{cell.day}</div>
                {dayItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    title={`${item.title}${item.amount ? ` — ${formatCurrency(item.amount)}` : ""}`}
                    className="text-[0.65rem] px-1.5 py-0.5 rounded truncate"
                    style={{
                      borderLeft: `3px solid ${KIND_COLORS[item.kind]}`,
                      background: "var(--light-bg)",
                      color: "var(--text-secondary)",
                      opacity: item.done ? 0.5 : 1,
                    }}
                  >
                    {item.title}
                  </div>
                ))}
                {dayItems.length > 3 && (
                  <div className="text-[0.65rem] text-text-tertiary">+{dayItems.length - 3} more</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
