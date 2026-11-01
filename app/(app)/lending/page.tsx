"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import StatTile from "@/components/dashboard/StatTile";
import { formatCurrency } from "@/lib/constants";

const AVATAR_COLORS = [
  ["#14a085", "#095c4b"],
  ["#e2c07f", "#a9803f"],
  ["#0891b2", "#095c4b"],
  ["#8b5cf6", "#4c1d95"],
  ["#ef4444", "#991b1b"],
  ["#f59e0b", "#92400e"],
];

function avatarGradient(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const [from, to] = AVATAR_COLORS[idx];
  return `linear-gradient(135deg, ${from}, ${to})`;
}

type Person = {
  _id: string;
  name: string;
  note?: string;
  lent: number;
  returned: number;
  balance: number;
};

export default function LendingPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/lending/people");
    const data = await res.json();
    setPeople(data.people ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this person and all their lending history?")) return;
    const res = await fetch(`/api/lending/people/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Could not delete");
      return;
    }
    load();
  }

  const totalOwed = people.reduce((s, p) => s + Math.max(p.balance, 0), 0);

  return (
    <div>
      <PageHeader
        icon="🤝"
        title="Lent & Borrowed"
        subtitle="Track money lent to people, what they've returned, and what they still owe."
        action={
          <button
            className="btn btn-gold"
            onClick={() => {
              setError(null);
              setShowModal(true);
            }}
          >
            + Add Person
          </button>
        }
      />

      <div className="max-w-xs mb-6">
        <StatTile label="Total Owed to You" value={formatCurrency(totalOwed)} tone="gold" icon="💰" />
      </div>

      {loading ? (
        <p className="text-text-tertiary text-sm italic">Loading…</p>
      ) : people.length === 0 ? (
        <div className="card">
          <p className="text-text-tertiary italic text-sm">No one added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((p) => (
            <div key={p._id} className="card mb-0! relative overflow-hidden">
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{
                  background:
                    p.balance > 0
                      ? "linear-gradient(90deg, var(--danger-light), var(--danger))"
                      : p.balance < 0
                      ? "linear-gradient(90deg, var(--success-light), var(--success))"
                      : "linear-gradient(90deg, var(--gold-light), var(--gold-dark))",
                }}
              />
              <div className="flex items-start justify-between mb-3">
                <Link href={`/lending/${p._id}`} className="flex items-center gap-2.5 group">
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-xs flex-shrink-0"
                    style={{ background: avatarGradient(p.name) }}
                  >
                    {p.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="font-extrabold text-text-primary group-hover:text-primary">{p.name}</span>
                </Link>
                <button className="text-text-tertiary text-sm" onClick={() => handleDelete(p._id)}>
                  🗑️
                </button>
              </div>
              <div
                className={`text-xl font-black mb-1 ${
                  p.balance > 0 ? "text-danger" : p.balance < 0 ? "text-success" : "text-text-primary"
                }`}
              >
                {formatCurrency(Math.abs(p.balance))}
              </div>
              <div className="text-xs text-text-tertiary mb-4">
                {p.balance > 0 ? "owes you" : p.balance < 0 ? "you owe them" : "settled up"}
              </div>
              <div className="flex justify-between text-xs text-text-secondary">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                  Lent: {formatCurrency(p.lent)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  Returned: {formatCurrency(p.returned)}
                </span>
              </div>
              <Link
                href={`/lending/${p._id}`}
                className="btn btn-secondary w-full justify-center mt-4 text-xs py-2"
              >
                View history
              </Link>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddPersonModal
          error={error}
          onError={setError}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function AddPersonModal({
  error,
  onError,
  onClose,
  onSaved,
}: {
  error: string | null;
  onError: (e: string | null) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onError(null);
    setSaving(true);
    const res = await fetch("/api/lending/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, note }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      onError(data.error || "Something went wrong");
      return;
    }
    onSaved();
  }

  return (
    <Modal title="Add Person" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-sm text-danger font-semibold mb-3">{error}</p>}
        <div className="mb-4">
          <label className="form-label">Name</label>
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label className="form-label">Note (optional)</label>
          <input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button className="btn btn-primary w-full justify-center" disabled={saving}>
          {saving ? "Saving…" : "💾 Add Person"}
        </button>
      </form>
    </Modal>
  );
}
