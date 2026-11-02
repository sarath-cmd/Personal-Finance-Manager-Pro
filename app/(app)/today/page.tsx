"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import StatTile from "@/components/dashboard/StatTile";
import PaymentMethodIcon from "@/components/transactions/PaymentMethodIcon";
import { formatCurrency, formatDate } from "@/lib/constants";
import type { CalendarItem } from "@/components/calendar/MonthGrid";
import { SkeletonCard, SkeletonStatRow } from "@/components/ui/Skeleton";

type Transaction = {
  _id: string;
  description: string;
  category: string;
  amount: number;
  type: string;
  paymentMethod?: string | null;
};

type TodayData = {
  date: string;
  transactions: Transaction[];
  dueToday: CalendarItem[];
  upcoming: CalendarItem[];
  netToday: number;
};

function Inner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskName, setTaskName] = useState("");
  const [taskDate, setTaskDate] = useState(new Date().toISOString().slice(0, 10));
  const [savingTask, setSavingTask] = useState(false);
  const taskInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/today");
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      taskInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      taskInputRef.current?.focus();
      router.replace("/today");
    }
  }, [searchParams, router]);

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    setSavingTask(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: taskName, date: taskDate }),
    });
    setSavingTask(false);
    if (res.ok) {
      setTaskName("");
      load();
    }
  }

  const todayLabel = data
    ? new Date(`${data.date}T00:00:00.000Z`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : "-";

  return (
    <div>
      <PageHeader icon="☀️" title="Today" subtitle={todayLabel} />

      {loading || !data ? (
        <>
          <SkeletonStatRow count={3} cols={3} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={4} />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatTile label="Transactions Today" value={String(data.transactions.length)} tone="info" icon="📜" />
            <StatTile label="Due Today" value={String(data.dueToday.length)} tone="gold" icon="📑" />
            <StatTile
              label="Net Today"
              value={formatCurrency(data.netToday)}
              tone={data.netToday >= 0 ? "pos" : "neg"}
              icon="💰"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            <div className="card mb-0!">
              <h2 className="font-extrabold text-text-primary mb-5 flex items-center gap-2">
                <span className="icon-chip">📜</span>
                Today&apos;s Transactions
              </h2>
              <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center italic text-text-tertiary py-7">
                        Nothing recorded today.
                      </td>
                    </tr>
                  )}
                  {data.transactions.map((t) => (
                    <tr key={t._id}>
                      <td className="font-semibold text-text-primary">
                        {t.description}
                        <PaymentMethodIcon method={t.paymentMethod} />
                      </td>
                      <td>{t.category}</td>
                      <td className={t.type === "income" ? "font-bold text-success" : "font-bold text-danger"}>
                        {t.type === "income" ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            <div className="card mb-0!">
              <h2 className="font-extrabold text-text-primary mb-5 flex items-center gap-2">
                <span className="icon-chip gold">📑</span>
                Due Today
              </h2>
              {data.dueToday.length === 0 ? (
                <p className="text-text-tertiary text-sm italic">Nothing due today.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.dueToday.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-light-bg border border-border-color rounded-lg px-3.5 py-2.5"
                    >
                      <span className="font-semibold text-text-primary text-sm flex-1">{item.title}</span>
                      {item.amount !== undefined && (
                        <span className="font-bold text-text-primary text-sm">{formatCurrency(item.amount)}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="font-extrabold text-text-primary mb-5 flex items-center gap-2">
              <span className="icon-chip">🗓️</span>
              Upcoming (next 14 days)
            </h2>
            {data.upcoming.length === 0 ? (
              <p className="text-text-tertiary text-sm italic">Nothing coming up.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {data.upcoming.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    <span className="text-xs font-bold text-text-tertiary w-20 flex-shrink-0">{formatDate(item.date)}</span>
                    <span className="font-semibold text-text-primary flex-1">{item.title}</span>
                    {item.amount !== undefined && (
                      <span className="font-bold text-text-primary">{formatCurrency(item.amount)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-extrabold text-text-primary mb-5 flex items-center gap-2">
              <span className="icon-chip gold">✅</span>
              Add a Task
            </h2>
            <form onSubmit={handleAddTask} className="flex gap-3 flex-wrap items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="form-label">Task</label>
                <input
                  ref={taskInputRef}
                  className="form-input"
                  placeholder="e.g. Review monthly budget"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} required />
              </div>
              <button className="btn btn-primary" disabled={savingTask}>
                {savingTask ? "Saving…" : "💾 Add Task"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default function TodayPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
