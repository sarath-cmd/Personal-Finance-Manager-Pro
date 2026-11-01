"use client";

import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import StatTile from "@/components/dashboard/StatTile";
import ProgressBar from "@/components/ui/ProgressBar";
import { formatCurrency, DEBT_TYPES } from "@/lib/constants";

type Debt = {
  _id: string;
  name: string;
  type: (typeof DEBT_TYPES)[number];
  openingBalance: number;
  interestRate: number;
  minPayment: number;
  dueDay: number | null;
  paidToDate: number;
  remainingBalance: number;
};

export default function DebtPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [paying, setPaying] = useState<Debt | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/debts");
    const data = await res.json();
    setDebts(data.debts ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this debt and its payment history?")) return;
    await fetch(`/api/debts/${id}`, { method: "DELETE" });
    load();
  }

  const totalRemaining = debts.reduce((s, d) => s + d.remainingBalance, 0);
  const totalPaid = debts.reduce((s, d) => s + d.paidToDate, 0);

  return (
    <div>
      <PageHeader
        icon="💳"
        title="Debt Payoff"
        subtitle="Track balances, interest and payments toward paying off debt."
        action={
          <button
            className="btn btn-gold"
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
          >
            + Add Debt
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatTile label="Total Remaining" value={formatCurrency(totalRemaining)} tone="neg" icon="💳" />
        <StatTile label="Total Paid" value={formatCurrency(totalPaid)} tone="pos" icon="✅" />
      </div>

      {loading ? (
        <p className="text-text-tertiary text-sm italic">Loading…</p>
      ) : debts.length === 0 ? (
        <div className="card">
          <p className="text-text-tertiary italic text-sm">No debts recorded.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {debts.map((d) => {
            const pct = d.openingBalance > 0 ? Math.round((d.paidToDate / d.openingBalance) * 100) : 0;
            return (
              <div key={d._id} className="card mb-0!">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="badge badge-expense mb-2 inline-block">{d.type}</span>
                    <h3 className="font-extrabold text-text-primary">{d.name}</h3>
                  </div>
                  <button className="text-text-tertiary text-sm" onClick={() => handleDelete(d._id)}>
                    🗑️
                  </button>
                </div>
                <div className="text-lg font-black text-danger mb-1">{formatCurrency(d.remainingBalance)}</div>
                <p className="text-xs text-text-tertiary mb-2">
                  of {formatCurrency(d.openingBalance)} · {d.interestRate}% APR
                </p>
                <ProgressBar pct={pct} />
                <p className="text-xs text-text-tertiary mt-2 mb-4">{pct}% paid off</p>
                <div className="flex justify-between text-xs text-text-secondary mb-4">
                  <span>Min payment: {formatCurrency(d.minPayment)}</span>
                  {d.dueDay && <span>Due day {d.dueDay}</span>}
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-primary flex-1 justify-center text-xs py-2" onClick={() => setPaying(d)}>
                    + Log Payment
                  </button>
                  <button
                    className="btn btn-secondary text-xs py-2 px-3"
                    onClick={() => {
                      setEditing(d);
                      setShowModal(true);
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

      {showModal && (
        <DebtFormModal
          debt={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}

      {paying && (
        <PaymentFormModal
          debt={paying}
          onClose={() => setPaying(null)}
          onSaved={() => {
            setPaying(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function DebtFormModal({
  debt,
  onClose,
  onSaved,
}: {
  debt: Debt | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(debt?.name ?? "");
  const [type, setType] = useState<(typeof DEBT_TYPES)[number]>(debt?.type ?? "Credit Card");
  const [openingBalance, setOpeningBalance] = useState(debt ? String(debt.openingBalance) : "");
  const [interestRate, setInterestRate] = useState(debt ? String(debt.interestRate) : "0");
  const [minPayment, setMinPayment] = useState(debt ? String(debt.minPayment) : "0");
  const [dueDay, setDueDay] = useState(debt?.dueDay ? String(debt.dueDay) : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload: Record<string, unknown> = {
      name,
      type,
      interestRate: Number(interestRate),
      minPayment: Number(minPayment),
      dueDay: dueDay ? Number(dueDay) : null,
    };
    if (!debt) payload.openingBalance = Number(openingBalance);

    const res = await fetch(debt ? `/api/debts/${debt._id}` : "/api/debts", {
      method: debt ? "PATCH" : "POST",
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
    <Modal title={debt ? "Edit Debt" : "Add Debt"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-sm text-danger font-semibold mb-3">{error}</p>}
        <div className="mb-4">
          <label className="form-label">Name</label>
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label className="form-label">Type</label>
          <select className="form-select" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            {DEBT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        {!debt && (
          <div className="mb-4">
            <label className="form-label">Opening Balance (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              required
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="form-label">Interest Rate (%)</label>
            <input type="number" step="0.01" min="0" className="form-input" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Min Payment (₹)</label>
            <input type="number" step="0.01" min="0" className="form-input" value={minPayment} onChange={(e) => setMinPayment(e.target.value)} />
          </div>
        </div>
        <div className="mb-4">
          <label className="form-label">Due Day (optional)</label>
          <input type="number" min="1" max="31" className="form-input" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
        </div>
        <button className="btn btn-primary w-full justify-center" disabled={saving}>
          {saving ? "Saving…" : "💾 Save Debt"}
        </button>
      </form>
    </Modal>
  );
}

function PaymentFormModal({
  debt,
  onClose,
  onSaved,
}: {
  debt: Debt;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(debt.minPayment ? String(debt.minPayment) : "");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const res = await fetch("/api/debts/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ debtId: debt._id, date, amount: Number(amount), note }),
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
    <Modal title={`Log Payment — ${debt.name}`} onClose={onClose}>
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
          {saving ? "Saving…" : "💾 Log Payment"}
        </button>
      </form>
    </Modal>
  );
}
