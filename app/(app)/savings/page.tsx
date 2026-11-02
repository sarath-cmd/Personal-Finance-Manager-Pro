"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import StatTile from "@/components/dashboard/StatTile";
import ProgressBar from "@/components/ui/ProgressBar";
import { formatCurrency, formatDate, SAVINGS_GOAL_KINDS, SAVINGS_GOAL_KIND_LABELS } from "@/lib/constants";
import { SkeletonCardGrid, SkeletonTableRows } from "@/components/ui/Skeleton";

type Goal = {
  _id: string;
  name: string;
  kind: (typeof SAVINGS_GOAL_KINDS)[number];
  targetAmount: number;
  currentAmount: number;
  targetDate?: string | null;
  note?: string;
};
type Contribution = { _id: string; goalId: string; date: string; amount: number; note?: string };

function Inner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const month = searchParams.get("month") ?? "";

  const [goals, setGoals] = useState<Goal[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<"all" | (typeof SAVINGS_GOAL_KINDS)[number]>("all");
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (month) params.set("month", month);

    const [goalsRes, contribRes] = await Promise.all([
      fetch("/api/savings/goals"),
      fetch(`/api/savings/contributions?${params.toString()}`),
    ]);
    const goalsData = await goalsRes.json();
    const contribData = await contribRes.json();
    setGoals(goalsData.goals ?? []);
    setContributions(contribData.contributions ?? []);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch synced to the month param
    load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- opening the quick-add modal from a URL flag set by the global FAB
      setEditingGoal(null);
      setShowGoalModal(true);
      router.replace(month ? `/savings?month=${month}` : "/savings");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when the `new` param changes
  }, [searchParams]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this goal and its contribution history?")) return;
    await fetch(`/api/savings/goals/${id}`, { method: "DELETE" });
    load();
  }

  const goalById = new Map(goals.map((g) => [g._id, g]));
  const totalThisMonth = contributions.reduce((s, c) => s + c.amount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const filteredGoals = kindFilter === "all" ? goals : goals.filter((g) => g.kind === kindFilter);

  return (
    <div>
      <PageHeader
        icon="🐷"
        title="Savings"
        subtitle="Goals, sinking funds and your emergency fund — plus this month's contributions."
        action={
          <button
            className="btn btn-gold"
            onClick={() => {
              setEditingGoal(null);
              setShowGoalModal(true);
            }}
          >
            + Add Goal
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatTile label="Saved This Month" value={formatCurrency(totalThisMonth)} tone="pos" icon="🐷" />
        <StatTile label="Total Saved (all goals)" value={formatCurrency(totalSaved)} tone="gold" icon="💰" />
        <StatTile label="Active Goals" value={String(goals.length)} tone="info" icon="🎯" />
      </div>

      <div className="flex bg-light-bg border border-border-color rounded-xl p-1 gap-1 mb-6 max-w-lg">
        <button
          type="button"
          onClick={() => setKindFilter("all")}
          className="flex-1 py-2 rounded-lg text-xs font-bold"
          style={kindFilter === "all" ? { background: "linear-gradient(135deg, var(--primary-light), var(--primary-dark))", color: "#fff" } : { color: "var(--text-secondary)" }}
        >
          All
        </button>
        {SAVINGS_GOAL_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKindFilter(k)}
            className="flex-1 py-2 rounded-lg text-xs font-bold"
            style={kindFilter === k ? { background: "linear-gradient(135deg, var(--primary-light), var(--primary-dark))", color: "#fff" } : { color: "var(--text-secondary)" }}
          >
            {SAVINGS_GOAL_KIND_LABELS[k]}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonCardGrid count={3} />
      ) : filteredGoals.length === 0 ? (
        <div className="card">
          <p className="text-text-tertiary italic text-sm">No goals yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((g) => {
            const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
            return (
              <div key={g._id} className="card mb-0!">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="badge badge-gold mb-2 inline-block">{SAVINGS_GOAL_KIND_LABELS[g.kind]}</span>
                    <h3 className="font-extrabold text-text-primary">{g.name}</h3>
                  </div>
                  <button className="text-text-tertiary text-sm" onClick={() => handleDelete(g._id)}>
                    🗑️
                  </button>
                </div>
                <div className="text-lg font-black text-text-primary mb-1">
                  {formatCurrency(g.currentAmount)}{" "}
                  <span className="text-sm font-semibold text-text-tertiary">of {formatCurrency(g.targetAmount)}</span>
                </div>
                <ProgressBar pct={pct} color="linear-gradient(90deg, var(--gold-light), var(--gold-dark))" />
                <p className="text-xs text-text-tertiary mt-2 mb-4">{pct}% funded</p>
                <div className="flex gap-2">
                  <button
                    className="btn btn-primary flex-1 justify-center text-xs py-2"
                    onClick={() => setContributingGoal(g)}
                  >
                    + Contribute
                  </button>
                  <button
                    className="btn btn-secondary text-xs py-2 px-3"
                    onClick={() => {
                      setEditingGoal(g);
                      setShowGoalModal(true);
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card mt-6">
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

      {showGoalModal && (
        <GoalFormModal
          goal={editingGoal}
          onClose={() => setShowGoalModal(false)}
          onSaved={() => {
            setShowGoalModal(false);
            load();
          }}
        />
      )}

      {contributingGoal && (
        <ContributionFormModal
          goal={contributingGoal}
          onClose={() => setContributingGoal(null)}
          onSaved={() => {
            setContributingGoal(null);
            load();
          }}
        />
      )}
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

function GoalFormModal({
  goal,
  onClose,
  onSaved,
}: {
  goal: Goal | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(goal?.name ?? "");
  const [kind, setKind] = useState<(typeof SAVINGS_GOAL_KINDS)[number]>(goal?.kind ?? "goal");
  const [targetAmount, setTargetAmount] = useState(goal ? String(goal.targetAmount) : "");
  const [targetDate, setTargetDate] = useState(goal?.targetDate?.slice(0, 10) ?? "");
  const [note, setNote] = useState(goal?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      name,
      kind,
      targetAmount: Number(targetAmount),
      targetDate: targetDate || null,
      note,
    };

    const res = await fetch(goal ? `/api/savings/goals/${goal._id}` : "/api/savings/goals", {
      method: goal ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    onSaved();
  }

  return (
    <Modal title={goal ? "Edit Goal" : "Add Goal"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-sm text-danger font-semibold mb-3">{error}</p>}
        <div className="mb-4">
          <label className="form-label">Name</label>
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label className="form-label">Type</label>
          <select className="form-select" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
            {SAVINGS_GOAL_KINDS.map((k) => (
              <option key={k} value={k}>
                {SAVINGS_GOAL_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="form-label">Target Amount (₹)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="form-input"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="form-label">Target Date (optional)</label>
          <input type="date" className="form-input" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="form-label">Note (optional)</label>
          <input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button className="btn btn-primary w-full justify-center" disabled={saving}>
          {saving ? "Saving…" : "💾 Save Goal"}
        </button>
      </form>
    </Modal>
  );
}

function ContributionFormModal({
  goal,
  onClose,
  onSaved,
}: {
  goal: Goal;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const res = await fetch("/api/savings/contributions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId: goal._id, date, amount: Number(amount), note }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    onSaved();
  }

  return (
    <Modal title={`Contribute to ${goal.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-sm text-danger font-semibold mb-3">{error}</p>}
        <div className="mb-4">
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="mb-4">
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
        <div className="mb-4">
          <label className="form-label">Note (optional)</label>
          <input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button className="btn btn-primary w-full justify-center" disabled={saving}>
          {saving ? "Saving…" : "💾 Add Contribution"}
        </button>
      </form>
    </Modal>
  );
}
