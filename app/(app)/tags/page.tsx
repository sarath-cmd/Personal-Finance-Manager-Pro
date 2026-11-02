"use client";

import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { TAG_PALETTE } from "@/lib/constants";
import { SkeletonCard } from "@/components/ui/Skeleton";

type Tag = { _id: string; kind: "expense" | "income"; name: string; color: string };

function TagSection({ kind, title, tags, onChanged }: { kind: "expense" | "income"; title: string; tags: Tag[]; onChanged: () => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(TAG_PALETTE[0]);
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, name, color }),
    });
    setSaving(false);
    setName("");
    onChanged();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this tag?")) return;
    await fetch(`/api/tags/${id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="card">
      <h2 className="font-extrabold text-text-primary mb-5 flex items-center gap-2">
        <span className={`icon-chip ${kind === "income" ? "" : "gold"}`}>{kind === "income" ? "💵" : "🧾"}</span>
        {title}
      </h2>

      <div className="flex flex-wrap gap-2 mb-5">
        {tags.length === 0 && <p className="text-text-tertiary text-sm italic">No tags yet.</p>}
        {tags.map((t) => (
          <span
            key={t._id}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: `${t.color}1f`, color: t.color, border: `1px solid ${t.color}55` }}
          >
            {t.name}
            <button type="button" onClick={() => handleDelete(t._id)} className="opacity-70 hover:opacity-100">
              ×
            </button>
          </span>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 items-center flex-wrap">
        <input
          className="form-input flex-1 min-w-[160px]"
          placeholder="New tag name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex gap-1.5">
          {TAG_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full"
              style={{ background: c, outline: color === c ? "2px solid var(--text-primary)" : "none", outlineOffset: "2px" }}
              aria-label={c}
            />
          ))}
        </div>
        <button className="btn btn-primary text-xs py-2 px-4" disabled={saving}>
          + Add
        </button>
      </form>
    </div>
  );
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [expenseRes, incomeRes] = await Promise.all([
      fetch("/api/tags?kind=expense"),
      fetch("/api/tags?kind=income"),
    ]);
    const expenseData = await expenseRes.json();
    const incomeData = await incomeRes.json();
    setTags([...(expenseData.tags ?? []), ...(incomeData.tags ?? [])]);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  return (
    <div>
      <PageHeader icon="🏷️" title="Tags" subtitle="Color-coded labels for income and expense transactions." />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <TagSection kind="expense" title="Expense Tags" tags={tags.filter((t) => t.kind === "expense")} onChanged={load} />
          <TagSection kind="income" title="Income Tags" tags={tags.filter((t) => t.kind === "income")} onChanged={load} />
        </div>
      )}
    </div>
  );
}
