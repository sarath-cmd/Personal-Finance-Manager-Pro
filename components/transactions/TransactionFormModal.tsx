"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import TagPicker from "@/components/transactions/TagPicker";
import {
  DEFAULT_CATEGORIES,
  INCOME_CATEGORIES,
  INCOME_STATUSES,
  CLASSIFICATIONS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_ICONS,
} from "@/lib/constants";

export type Account = { _id: string; name: string; type: string };

export type Transaction = {
  _id: string;
  type: "income" | "expense";
  date: string;
  description: string;
  amount: number;
  category: string;
  accountId: string | null;
  tags: string[];
  paymentMethod?: string | null;
  status?: string;
  classification?: string;
};

export default function TransactionFormModal({
  transaction,
  accounts,
  defaultType,
  lockType,
  onClose,
  onSaved,
}: {
  transaction: Transaction | null;
  accounts: Account[];
  defaultType: "income" | "expense";
  lockType?: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<"income" | "expense">(transaction?.type ?? defaultType);
  const [date, setDate] = useState(transaction?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
  const [category, setCategory] = useState(
    transaction?.category ?? (defaultType === "income" ? INCOME_CATEGORIES[0] : DEFAULT_CATEGORIES[0])
  );
  const [accountId, setAccountId] = useState(transaction?.accountId ?? "");
  const [paymentMethod, setPaymentMethod] = useState(transaction?.paymentMethod ?? "");
  const [status, setStatus] = useState(transaction?.status ?? "Received");
  const [classification, setClassification] = useState(transaction?.classification ?? "Unclassified");
  const [tags, setTags] = useState<string[]>(transaction?.tags ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<string[]>(
    type === "income" ? [...INCOME_CATEGORIES] : [...DEFAULT_CATEGORIES]
  );

  useEffect(() => {
    fetch(`/api/categories?kind=${type}`)
      .then((r) => r.json())
      .then((data) => {
        const names = (data.categories ?? []).map((c: { name: string }) => c.name);
        if (names.length) setCategories(names);
      })
      .catch(() => {});
  }, [type]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload: Record<string, unknown> = {
      type,
      date,
      description,
      amount: Number(amount),
      category,
      accountId: accountId || null,
      tags,
      paymentMethod: paymentMethod || null,
    };
    if (type === "income") payload.status = status;
    if (type === "expense") payload.classification = classification;

    const res = await fetch(
      transaction ? `/api/transactions/${transaction._id}` : "/api/transactions",
      {
        method: transaction ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    onSaved();
  }

  return (
    <Modal title={transaction ? "Edit Transaction" : "Add Transaction"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-sm text-danger font-semibold mb-3">{error}</p>}

        {!lockType && (
          <div className="mb-4">
            <label className="form-label">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`btn flex-1 justify-center ${type === "income" ? "btn-primary" : "btn-secondary opacity-60"}`}
                onClick={() => {
                  setType("income");
                  setCategory(INCOME_CATEGORIES[0]);
                }}
              >
                Income
              </button>
              <button
                type="button"
                className={`btn flex-1 justify-center ${type === "expense" ? "btn-primary" : "btn-secondary opacity-60"}`}
                onClick={() => {
                  setType("expense");
                  setCategory(DEFAULT_CATEGORIES[0]);
                }}
              >
                Expense
              </button>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div className="mb-4">
          <label className="form-label">{type === "income" ? "Source / Description" : "Merchant / Description"}</label>
          <input
            className="form-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
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
          <label className="form-label">Category</label>
          <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="form-label">Account</label>
          <select className="form-select" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">No account</option>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="form-label">Payment Method (optional)</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(paymentMethod === m ? "" : m)}
                className={`flex flex-col items-center justify-center gap-1 rounded-lg border py-2.5 text-[0.7rem] font-semibold transition-colors ${
                  paymentMethod === m
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border-color text-text-secondary hover:border-text-tertiary"
                }`}
              >
                <span className="text-base leading-none">{PAYMENT_METHOD_ICONS[m]}</span>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label">Tags</label>
          <TagPicker kind={type} value={tags} onChange={setTags} />
        </div>

        {type === "income" && (
          <div className="mb-4">
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              {INCOME_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {type === "expense" && (
          <div className="mb-4">
            <label className="form-label">Need or Want</label>
            <select className="form-select" value={classification} onChange={(e) => setClassification(e.target.value)}>
              {CLASSIFICATIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        <button className="btn btn-primary w-full justify-center" disabled={saving}>
          {saving ? "Saving…" : "💾 Save Transaction"}
        </button>
      </form>
    </Modal>
  );
}
