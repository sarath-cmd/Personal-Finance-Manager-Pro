"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import StatTile from "@/components/dashboard/StatTile";
import { formatCurrency, formatDate, LENDING_ENTRY_TYPES } from "@/lib/constants";

type Person = { _id: string; name: string; lent: number; returned: number; balance: number };
type Entry = { _id: string; date: string; type: "lent" | "returned"; amount: number; note?: string };

function Inner() {
  const { personId } = useParams<{ personId: string }>();
  const searchParams = useSearchParams();
  const month = searchParams.get("month") ?? "";

  const [person, setPerson] = useState<Person | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ personId });
    if (month) params.set("month", month);

    const [peopleRes, entriesRes] = await Promise.all([
      fetch("/api/lending/people"),
      fetch(`/api/lending/entries?${params.toString()}`),
    ]);
    const peopleData = await peopleRes.json();
    const entriesData = await entriesRes.json();
    setPerson((peopleData.people ?? []).find((p: Person) => p._id === personId) ?? null);
    setEntries(entriesData.entries ?? []);
    setLoading(false);
  }, [personId, month]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch synced to the `month` query param
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    const res = await fetch(`/api/lending/entries/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Could not delete entry");
      return;
    }
    load();
  }

  return (
    <div>
      <Link href="/lending" className="text-sm text-primary font-semibold">
        ‹ Back to Lent &amp; Borrowed
      </Link>

      {loading || !person ? (
        <p className="text-text-tertiary text-sm italic mt-4">Loading…</p>
      ) : (
        <>
          <div className="flex items-start justify-between flex-wrap gap-4 mt-4 mb-6">
            <div className="flex items-center gap-3">
              <span
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, var(--primary-light), var(--primary-dark))" }}
              >
                {person.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <h1 className="text-2xl font-extrabold text-text-primary mb-1">{person.name}</h1>
                <p className="text-text-secondary text-sm">
                  Lifetime lent {formatCurrency(person.lent)} · returned {formatCurrency(person.returned)}
                </p>
              </div>
            </div>
            <button
              className="btn btn-gold"
              onClick={() => {
                setEditing(null);
                setShowModal(true);
              }}
            >
              + Add Entry
            </button>
          </div>

          <div className="max-w-xs mb-6">
            <StatTile
              label="Current Balance"
              value={formatCurrency(Math.abs(person.balance))}
              tone={person.balance > 0 ? "neg" : person.balance < 0 ? "pos" : "gold"}
              icon={person.balance > 0 ? "📤" : person.balance < 0 ? "📥" : "✅"}
            />
            <p className="text-xs text-text-tertiary mt-2 ml-1">
              {person.balance > 0
                ? "they still owe this"
                : person.balance < 0
                ? "you owe them"
                : "settled up"}
            </p>
          </div>

          <div className="card">
            <h2 className="font-extrabold text-text-primary mb-5">History this month</h2>
            <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Note</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center italic text-text-tertiary py-7">
                      Nothing recorded this month.
                    </td>
                  </tr>
                )}
                {entries.map((e) => (
                  <tr key={e._id}>
                    <td>{formatDate(e.date)}</td>
                    <td>
                      <span className={`badge ${e.type === "lent" ? "badge-expense" : "badge-income"}`}>
                        {e.type}
                      </span>
                    </td>
                    <td className="font-bold text-text-primary">{formatCurrency(e.amount)}</td>
                    <td>{e.note || "-"}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="text-primary text-xs font-bold"
                          onClick={() => {
                            setEditing(e);
                            setShowModal(true);
                          }}
                        >
                          Edit
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(e._id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}

      {showModal && (
        <EntryFormModal
          personId={personId}
          entry={editing}
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

function EntryFormModal({
  personId,
  entry,
  onClose,
  onSaved,
}: {
  personId: string;
  entry: Entry | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<"lent" | "returned">(entry?.type ?? "lent");
  const [date, setDate] = useState(entry?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(entry ? String(entry.amount) : "");
  const [note, setNote] = useState(entry?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = { personId, date, type, amount: Number(amount), note };
    const res = await fetch(entry ? `/api/lending/entries/${entry._id}` : "/api/lending/entries", {
      method: entry ? "PATCH" : "POST",
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
    <Modal title={entry ? "Edit Entry" : "Add Entry"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-sm text-danger font-semibold mb-3">{error}</p>}
        <div className="mb-4">
          <label className="form-label">Type</label>
          <select className="form-select" value={type} onChange={(e) => setType(e.target.value as "lent" | "returned")}>
            {LENDING_ENTRY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === "lent" ? "Money Lent" : "Money Returned"}
              </option>
            ))}
          </select>
        </div>
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
          {saving ? "Saving…" : "💾 Save Entry"}
        </button>
      </form>
    </Modal>
  );
}

export default function LendingPersonPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
