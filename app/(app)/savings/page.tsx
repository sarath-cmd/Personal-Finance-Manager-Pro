"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import StatTile from "@/components/dashboard/StatTile";
import { formatCurrency, formatDate, SAVINGS_GOAL_KIND_LABELS } from "@/lib/constants";
import { SkeletonTableRows } from "@/components/ui/Skeleton";

type Contribution = { _id: string; goalId: string; date: string; amount: number; note?: string };
type Goal = { _id: string; name: string; kind: keyof typeof SAVINGS_GOAL_KIND_LABELS; currentAmount: number; targetAmount: number };

function Inner() {
  const searchParams = useSearchParams();
  const month = searchParams.get("month") ?? "";

  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (month) params.set("month", month);

    const [contribRes, goalsRes] = await Promise.all([
      fetch(`/api/savings/contributions?${params.toString()}`),
      fetch("/api/savings/goals"),
    ]);
    const contribData = await contribRes.json();
    const goalsData = await goalsRes.json();
    setContributions(contribData.contributions ?? []);
    setGoals(goalsData.goals ?? []);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch synced to the month param
    load();
  }, [load]);

  const goalById = new Map(goals.map((g) => [g._id, g]));
  const totalThisMonth = contributions.reduce((s, c) => s + c.amount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);

  return (
    <div>
      <PageHeader
        icon="🐷"
        title="Savings"
        subtitle="This month's contributions across all your savings goals."
        action={
          <Link href="/savings/goals" className="btn btn-gold">
            🎯 Manage Goals
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatTile label="Saved This Month" value={formatCurrency(totalThisMonth)} tone="pos" icon="🐷" />
        <StatTile label="Total Saved (all goals)" value={formatCurrency(totalSaved)} tone="gold" icon="💰" />
        <StatTile label="Active Goals" value={String(goals.length)} tone="info" icon="🎯" />
      </div>

      <div className="card">
        <h2 className="font-extrabold text-text-primary mb-5 flex items-center gap-2">
          <span className="icon-chip">📜</span>
          This Month&apos;s Contributions
        </h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Goal</th>
                <th>Amount</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {loading && <SkeletonTableRows rows={4} cols={4} />}
              {!loading && contributions.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center italic text-text-tertiary py-7">
                    Nothing contributed this month yet.
                  </td>
                </tr>
              )}
              {!loading && contributions.map((c) => (
                <tr key={c._id}>
                  <td>{formatDate(c.date)}</td>
                  <td className="font-semibold text-text-primary">{goalById.get(c.goalId)?.name ?? "—"}</td>
                  <td className="font-bold text-success">{formatCurrency(c.amount)}</td>
                  <td>{c.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function SavingsPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
