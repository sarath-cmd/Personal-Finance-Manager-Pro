"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import MonthGrid, { type CalendarItem } from "@/components/calendar/MonthGrid";
import { formatCurrency, formatDate, EVENT_TYPES } from "@/lib/constants";
import { getActiveMonth, monthLabel } from "@/lib/month";

const KIND_LABELS: Record<CalendarItem["kind"], string> = {
  bill: "Bill",
  subscription: "Subscription",
  income: "Income",
  debt: "Debt Payment",
  task: "Task",
  event: "Event",
};

function Inner() {
  const searchParams = useSearchParams();
  const month = getActiveMonth(searchParams.get("month"));

  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/calendar?month=${month}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch synced to the month param
    load();
  }, [load]);

  return (
    <div>
      <PageHeader icon="📅" title="Financial Calendar" subtitle="Bills, subscriptions, debt payments and tasks by date." />

      <div className="card">
        <h2 className="font-extrabold text-text-primary mb-5">{monthLabel(month)}</h2>
        {loading ? <p className="text-text-tertiary text-sm italic">Loading…</p> : <MonthGrid month={month} items={items} />}
      </div>

      <div className="card">
        <h2 className="font-extrabold text-text-primary mb-5 flex items-center gap-2">
          <span className="icon-chip">📋</span>
          Agenda
        </h2>
        {items.length === 0 ? (
          <p className="text-text-tertiary text-sm italic">Nothing scheduled this month.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-light-bg border border-border-color rounded-lg px-3.5 py-2.5"
              >
                <span className="text-xs font-bold text-text-tertiary w-20 flex-shrink-0">{formatDate(item.date)}</span>
                <span className="badge badge-info">{KIND_LABELS[item.kind]}</span>
                <span className="font-semibold text-text-primary text-sm flex-1">{item.title}</span>
                {item.amount !== undefined && (
                  <span className="font-bold text-text-primary text-sm">{formatCurrency(item.amount)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <EventForm month={month} onSaved={load} />
    </div>
  );
}

function EventForm({ month, onSaved }: { month: string; onSaved: () => void }) {
  const [date, setDate] = useState(`${month}-01`);
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof EVENT_TYPES)[number]>("One-time");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, name, type, amount: Number(amount) }),
    });
    setSaving(false);
    if (res.ok) {
      setName("");
      setAmount("");
      onSaved();
    }
  }

  return (
    <div className="card">
      <h2 className="font-extrabold text-text-primary mb-5 flex items-center gap-2">
        <span className="icon-chip gold">➕</span>
        Add Event
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Event</label>
            <input className="form-input" placeholder="e.g. Rent" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Type</label>
            <select className="form-select" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        </div>
        <button className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "💾 Add Event"}
        </button>
      </form>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
