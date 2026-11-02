"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";

export type TransferAccount = { _id: string; name: string; type: string };

export type Transfer = {
  _id: string;
  date: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note?: string;
};

export default function TransferFormModal({
  transfer,
  accounts,
  onClose,
  onSaved,
}: {
  transfer: Transfer | null;
  accounts: TransferAccount[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(transfer?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [fromAccountId, setFromAccountId] = useState(transfer?.fromAccountId ?? accounts[0]?._id ?? "");
  const [toAccountId, setToAccountId] = useState(
    transfer?.toAccountId ?? accounts.find((a) => a._id !== accounts[0]?._id)?._id ?? ""
  );
  const [amount, setAmount] = useState(transfer ? String(transfer.amount) : "");
  const [note, setNote] = useState(transfer?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sameAccount = fromAccountId && toAccountId && fromAccountId === toAccountId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (sameAccount) {
      setError("Choose two different accounts");
      return;
    }

    setSaving(true);
    const payload = { date, fromAccountId, toAccountId, amount: Number(amount), note };

    const res = await fetch(transfer ? `/api/transfers/${transfer._id}` : "/api/transfers", {
      method: transfer ? "PATCH" : "POST",
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

  if (accounts.length < 2) {
    return (
      <Modal title="Transfer Money" onClose={onClose}>
        <p className="text-sm text-text-secondary">
          You need at least two accounts to transfer money between them.
        </p>
      </Modal>
    );
  }

  return (
    <Modal title={transfer ? "Edit Transfer" : "Transfer Money"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-sm text-danger font-semibold mb-3">{error}</p>}

        <div className="mb-4">
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div className="mb-4">
          <label className="form-label">From</label>
          <select className="form-select" value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-center -my-1.5">
          <span className="text-text-tertiary text-lg">↓</span>
        </div>

        <div className="mb-4">
          <label className="form-label">To</label>
          <select className="form-select" value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>
          {sameAccount && <p className="text-xs text-danger mt-1.5">Choose two different accounts</p>}
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

        <button className="btn btn-primary w-full justify-center" disabled={saving || !!sameAccount}>
          {saving ? "Saving…" : "💾 Save Transfer"}
        </button>
      </form>
    </Modal>
  );
}
