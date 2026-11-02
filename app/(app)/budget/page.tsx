"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import StatTile from "@/components/dashboard/StatTile";
import ProgressBar from "@/components/ui/ProgressBar";
import { formatCurrency } from "@/lib/constants";
import { SkeletonForm } from "@/components/ui/Skeleton";

type Category = { _id: string; name: string };
type BudgetEntry = { category: string; amount: number };

function Inner() {
  const searchParams = useSearchParams();
  const month = searchParams.get("month") ?? "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
  const [spentByCategory, setSpentByCategory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (month) params.set("month", month);

    const [catRes, budgetRes] = await Promise.all([
      fetch("/api/categories?kind=expense"),
      fetch(`/api/budgets?${params.toString()}`),
    ]);
    const catData = await catRes.json();
    const budgetData = await budgetRes.json();
    setCategories(catData.categories ?? []);
    setBudgets(budgetData.budgets ?? []);
    setSpentByCategory(budgetData.spentByCategory ?? {});

    const nextInputs: Record<string, string> = {};
    for (const b of budgetData.budgets ?? []) nextInputs[b.category] = String(b.amount);
    setInputs(nextInputs);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch synced to the month param
    load();
  }, [load]);

  async function saveBudget(category: string) {
    const amount = Number(inputs[category] ?? 0);
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    const activeMonth = month || new Date().toISOString().slice(0, 7);

    await fetch("/api/budgets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: activeMonth, category, amount }),
    });
    load();
  }

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = Object.values(spentByCategory).reduce((s, v) => s + v, 0);

  return (
    <div>
      <PageHeader
        icon="📋"
        title="Monthly Budget"
        subtitle="Set a budget per category and track spending against it."
        action={
          <Link href="/budget/categories" className="btn btn-secondary text-xs py-2 px-4">
            🏷️ Manage Categories
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatTile label="Total Budgeted" value={formatCurrency(totalBudget)} tone="gold" icon="📋" />
        <StatTile label="Total Spent" value={formatCurrency(totalSpent)} tone="neg" icon="🧾" />
        <StatTile
          label="Remaining"
          value={formatCurrency(totalBudget - totalSpent)}
          tone={totalBudget - totalSpent >= 0 ? "pos" : "neg"}
          icon="💰"
        />
      </div>

      {loading ? (
        <SkeletonForm fields={5} />
      ) : categories.length === 0 ? (
        <div className="card">
          <p className="text-text-tertiary text-sm italic">
            No expense categories yet. <Link href="/budget/categories" className="text-primary font-semibold">Add some</Link>.
          </p>
        </div>
      ) : (
        <div className="card">
          <h2 className="font-extrabold text-text-primary mb-5 flex items-center gap-2">
            <span className="icon-chip">📈</span>
            Spending Tracker
          </h2>
          <div className="flex flex-col gap-6">
            {categories.map((c) => {
              const budgetAmount = Number(inputs[c.name] ?? 0);
              const spent = spentByCategory[c.name] ?? 0;
              const pct = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;
              const over = budgetAmount > 0 && spent > budgetAmount;

              return (
                <div key={c._id}>
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <span className="font-semibold text-text-primary text-sm">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary font-bold">
                        {formatCurrency(spent)} of
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input py-1.5 px-2.5 text-xs w-28"
                        value={inputs[c.name] ?? ""}
                        placeholder="0.00"
                        onChange={(e) => setInputs((prev) => ({ ...prev, [c.name]: e.target.value }))}
                        onBlur={() => saveBudget(c.name)}
                      />
                    </div>
                  </div>
                  <ProgressBar pct={pct} over={over} />
                  {over && (
                    <p className="text-xs text-danger font-semibold mt-1">
                      Over budget by {formatCurrency(spent - budgetAmount)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BudgetPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
