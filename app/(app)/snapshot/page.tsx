"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import StatTile from "@/components/dashboard/StatTile";
import { formatCurrency } from "@/lib/constants";
import { getActiveMonth, monthLabel } from "@/lib/month";
import { SkeletonForm, SkeletonStatRow } from "@/components/ui/Skeleton";

type Snapshot = {
  income: number;
  expense: number;
  savings: number;
  debt: number;
  assets: number;
  liabilities: number;
  netWorth: number;
  cashflow: number;
  budgetUsedPct: number;
  savingsRatePct: number;
  debtPaidThisMonth: number;
  expenseChangePct: number | null;
  note: { wentWell: string; changed: string };
};

function Inner() {
  const searchParams = useSearchParams();
  const month = getActiveMonth(searchParams.get("month"));

  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [wentWell, setWentWell] = useState("");
  const [changed, setChanged] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/snapshot?month=${month}`);
    const data = await res.json();
    setSnap(data);
    setWentWell(data.note?.wentWell ?? "");
    setChanged(data.note?.changed ?? "");
    setLoading(false);
  }, [month]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch synced to the month param
    load();
  }, [load]);

  async function saveNote() {
    await fetch("/api/snapshot", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, wentWell, changed }),
    });
  }

  return (
    <div>
      <PageHeader
        icon="🖼️"
        title="Financial Snapshot"
        subtitle="A factual snapshot of your recorded finances. Not a financial health score or advice."
      />

      {loading || !snap ? (
        <>
          <SkeletonStatRow count={8} />
          <SkeletonForm fields={4} />
          <SkeletonForm fields={2} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatTile label="Income" value={formatCurrency(snap.income)} tone="pos" icon="💵" />
            <StatTile label="Expenses" value={formatCurrency(snap.expense)} tone="neg" icon="🧾" />
            <StatTile label="Savings" value={formatCurrency(snap.savings)} tone="gold" icon="🐷" />
            <StatTile label="Debt" value={formatCurrency(snap.debt)} tone="neg" icon="💳" />
            <StatTile label="Assets" value={formatCurrency(snap.assets)} tone="pos" icon="🏦" />
            <StatTile label="Liabilities" value={formatCurrency(snap.liabilities)} tone="neg" icon="📉" />
            <StatTile label="Net Worth" value={formatCurrency(snap.netWorth)} tone="info" icon="🧮" />
            <StatTile
              label="Monthly Cash Flow"
              value={formatCurrency(snap.cashflow)}
              tone={snap.cashflow >= 0 ? "pos" : "neg"}
              icon="💹"
            />
          </div>

          <div className="card">
            <h2 className="font-extrabold text-text-primary mb-5 flex items-center gap-2">
              <span className="icon-chip">📊</span>
              Factual Indicators
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-light-bg border border-border-color rounded-xl p-4">
                <div className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Budget Used</div>
                <div className="text-xl font-black text-text-primary">{snap.budgetUsedPct}%</div>
              </div>
              <div className="bg-light-bg border border-border-color rounded-xl p-4">
                <div className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Savings Rate</div>
                <div className="text-xl font-black text-text-primary">{snap.savingsRatePct}%</div>
              </div>
              <div className="bg-light-bg border border-border-color rounded-xl p-4">
                <div className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Debt Paid</div>
                <div className="text-xl font-black text-text-primary">{formatCurrency(snap.debtPaidThisMonth)}</div>
              </div>
              <div className="bg-light-bg border border-border-color rounded-xl p-4">
                <div className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">
                  Expense vs Prior Month
                </div>
                <div className="text-xl font-black text-text-primary">
                  {snap.expenseChangePct === null ? "-" : `${snap.expenseChangePct > 0 ? "+" : ""}${snap.expenseChangePct}%`}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="font-extrabold text-text-primary mb-2 flex items-center gap-2">
              <span className="icon-chip gold">📝</span>
              Reflection — {monthLabel(month)}
            </h2>
            <p className="text-xs text-text-tertiary mb-5">Saved automatically when you click away.</p>
            <div className="mb-4">
              <label className="form-label">What went well?</label>
              <textarea
                className="form-input"
                rows={3}
                value={wentWell}
                onChange={(e) => setWentWell(e.target.value)}
                onBlur={saveNote}
                placeholder="Write a few notes for this month..."
              />
            </div>
            <div>
              <label className="form-label">What changed?</label>
              <textarea
                className="form-input"
                rows={3}
                value={changed}
                onChange={(e) => setChanged(e.target.value)}
                onBlur={saveNote}
                placeholder="Write a few notes for this month..."
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function SnapshotPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
