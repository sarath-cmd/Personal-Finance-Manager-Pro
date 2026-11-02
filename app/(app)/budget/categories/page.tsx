"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { SkeletonCard } from "@/components/ui/Skeleton";

type Category = { _id: string; kind: "expense" | "income"; name: string };

function CategorySection({
  kind,
  title,
  categories,
  onChanged,
}: {
  kind: "expense" | "income";
  title: string;
  categories: Category[];
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, name }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not add category");
      return;
    }
    setName("");
    onChanged();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="card">
      <h2 className="font-extrabold text-text-primary mb-5 flex items-center gap-2">
        <span className={`icon-chip ${kind === "income" ? "" : "gold"}`}>{kind === "income" ? "💵" : "🧾"}</span>
        {title}
      </h2>

      {error && <p className="text-sm text-danger font-semibold mb-3">{error}</p>}

      <div className="flex flex-col gap-2 mb-5">
        {categories.length === 0 && <p className="text-text-tertiary text-sm italic">No categories yet.</p>}
        {categories.map((c) => (
          <div
            key={c._id}
            className="flex items-center justify-between bg-light-bg border border-border-color rounded-lg px-3 py-2"
          >
            <span className="text-sm font-semibold text-text-primary">{c.name}</span>
            <button
              type="button"
              className="text-text-tertiary text-xs hover:text-danger"
              onClick={() => handleDelete(c._id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          className="form-input"
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn btn-primary text-xs py-2 px-4 whitespace-nowrap" disabled={saving}>
          + Add
        </button>
      </form>
    </div>
  );
}

export default function BudgetCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [expenseRes, incomeRes] = await Promise.all([
      fetch("/api/categories?kind=expense"),
      fetch("/api/categories?kind=income"),
    ]);
    const expenseData = await expenseRes.json();
    const incomeData = await incomeRes.json();
    setCategories([...(expenseData.categories ?? []), ...(incomeData.categories ?? [])]);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  return (
    <div>
      <PageHeader icon="🏷️" title="Budget Categories" subtitle="Manage the categories used across transactions and budgets." />
      <Link href="/budget" className="text-sm text-primary font-semibold mb-5 inline-block">
        ‹ Back to Monthly Budget
      </Link>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <CategorySection
            kind="expense"
            title="Expense Categories"
            categories={categories.filter((c) => c.kind === "expense")}
            onChanged={load}
          />
          <CategorySection
            kind="income"
            title="Income Categories"
            categories={categories.filter((c) => c.kind === "income")}
            onChanged={load}
          />
        </div>
      )}
    </div>
  );
}
