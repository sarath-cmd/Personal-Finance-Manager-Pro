"use client";

import { useEffect, useState } from "react";
import CashflowChart from "@/components/dashboard/CashflowChart";
import PageHeader from "@/components/ui/PageHeader";
import { formatCurrency } from "@/lib/constants";

type Point = { month: string; label: string; income: number; expense: number; net: number };

export default function CashflowPage() {
  const [series, setSeries] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cashflow")
      .then((r) => r.json())
      .then((data) => {
        setSeries(data.series ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <PageHeader icon="💹" title="Cash Flow" subtitle="Income vs expenses over the last 6 months." />

      <div className="card">
        {loading ? (
          <p className="text-text-tertiary text-sm italic">Loading…</p>
        ) : (
          <div style={{ height: 300 }}>
            <CashflowChart series={series} />
          </div>
        )}
      </div>

      {!loading && (
        <div className="card">
          <h2 className="font-extrabold text-text-primary mb-5 flex items-center gap-2">
            <span className="icon-chip">🗓️</span>
            Monthly Breakdown
          </h2>
          <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Income</th>
                <th>Expenses</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {series.map((s) => (
                <tr key={s.month}>
                  <td className="font-semibold text-text-primary">{s.label}</td>
                  <td className="text-success font-bold">{formatCurrency(s.income)}</td>
                  <td className="text-danger font-bold">{formatCurrency(s.expense)}</td>
                  <td>
                    <span className={`badge ${s.net >= 0 ? "badge-income" : "badge-expense"}`}>
                      {formatCurrency(s.net)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
