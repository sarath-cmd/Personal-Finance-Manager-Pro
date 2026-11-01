"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import StatTile from "@/components/dashboard/StatTile";
import PageHeader from "@/components/ui/PageHeader";
import { formatCurrency, formatDate } from "@/lib/constants";

type Summary = {
  income: number;
  expense: number;
  remaining: number;
  savingsRate: number;
  assets: number;
  liabilities: number;
  netWorth: number;
  savingsThisMonth: number;
  debtRemaining: number;
  debtPaidThisMonth: number;
  recentTransactions: {
    _id: string;
    date: string;
    description: string;
    category: string;
    amount: number;
    type: string;
  }[];
};

function DashboardInner() {
  const searchParams = useSearchParams();
  const month = searchParams.get("month") ?? "";
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    const res = await fetch(`/api/dashboard/summary?${params.toString()}`);
    const data = await res.json();
    setSummary(data);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch synced to the `month` query param
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        icon="📊"
        title="Your Financial Command Center"
        subtitle="See your money, accounts and lending in one place."
      />

      {loading || !summary ? (
        <p className="text-text-tertiary text-sm italic">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatTile label="Income This Month" value={formatCurrency(summary.income)} tone="pos" icon="💵" />
            <StatTile label="Expenses This Month" value={formatCurrency(summary.expense)} tone="neg" icon="🧾" />
            <StatTile
              label="Remaining"
              value={formatCurrency(summary.remaining)}
              tone={summary.remaining >= 0 ? "pos" : "neg"}
              icon="💰"
            />
            <StatTile label="Savings Rate" value={`${summary.savingsRate}%`} tone="gold" icon="📈" />
            <StatTile label="Total Assets" value={formatCurrency(summary.assets)} tone="pos" icon="🏦" />
            <StatTile label="Credit Card Balances" value={formatCurrency(summary.liabilities)} tone="neg" icon="💳" />
            <StatTile label="Net Worth" value={formatCurrency(summary.netWorth)} tone="info" icon="🧮" />
            <StatTile label="Savings This Month" value={formatCurrency(summary.savingsThisMonth)} tone="pos" icon="🐷" />
            <StatTile label="Debt Remaining" value={formatCurrency(summary.debtRemaining)} tone="neg" icon="💳" />
            <StatTile label="Debt Paid This Month" value={formatCurrency(summary.debtPaidThisMonth)} tone="gold" icon="✅" />
          </div>

          <div className="card">
            <h2 className="font-extrabold text-lg text-text-primary mb-5 flex items-center gap-2">
              <span className="icon-chip">📜</span>
              Recent Transactions
            </h2>
            <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center italic text-text-tertiary py-7">
                      No transactions recorded this month yet.
                    </td>
                  </tr>
                )}
                {summary.recentTransactions.map((t) => (
                  <tr key={t._id}>
                    <td>{formatDate(t.date)}</td>
                    <td className="font-semibold text-text-primary">{t.description}</td>
                    <td>{t.category}</td>
                    <td className={t.type === "income" ? "font-bold text-success" : "font-bold text-danger"}>
                      {t.type === "income" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </td>
                    <td>
                      <span className={`badge ${t.type === "income" ? "badge-income" : "badge-expense"}`}>
                        {t.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardInner />
    </Suspense>
  );
}
