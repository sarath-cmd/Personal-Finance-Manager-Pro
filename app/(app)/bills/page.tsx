"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import StatTile from "@/components/dashboard/StatTile";
import { formatCurrency, BILL_FREQUENCIES } from "@/lib/constants";

type Account = { _id: string; name: string };
type Bill = {
  _id: string;
  name: string;
  company?: string;
  category: string;
  amount: number;
  dueDay: number;
  frequency: string;
  isSubscription: boolean;
  autopay: boolean;
  accountId: string | null;
  active: boolean;
  paidThisMonth: boolean;
};

function Inner() {
  const searchParams = useSearchParams();
  const month = searchParams.get("month") ?? "";

  const [bills, setBills] = useState<Bill[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "recurring" | "subscriptions">("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (month) params.set("month", month);

    const [billRes, acctRes] = await Promise.all([
      fetch(`/api/bills?${params.toString()}`),
      fetch("/api/accounts"),
    ]);
    const billData = await billRes.json();
    const acctData = await acctRes.json();
    setBills(billData.bills ?? []);
    setAccounts(acctData.accounts ?? []);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch synced to month
    load();
  }, [load]);

  async function handlePay(id: string) {
    const res = await fetch(`/api/bills/${id}/pay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Could not mark bill paid");
      return;
    }
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this bill?")) return;
    await fetch(`/api/bills/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = bills.filter((b) => {
    if (filter === "recurring") return b.frequency !== undefined && !b.isSubscription;
    if (filter === "subscriptions") return b.isSubscription;
    return true;
  });

  const dueCount = bills.length;
  const paidCount = bills.filter((b) => b.paidThisMonth).length;
  const totalDue = bills.reduce((s, b) => s + b.amount, 0);

  return (
    <div>
      <PageHeader
        icon="📑"
        title="Bills"
        subtitle="Recurring bills and subscriptions, with a Mark Paid action for the active month."
        action={
          <button
            className="btn btn-gold"
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
          >
            + Add Bill
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatTile label="Bills This Month" value={String(dueCount)} tone="gold" icon="📑" />
        <StatTile label="Paid" value={String(paidCount)} tone="pos" icon="✅" />
        <StatTile label="Total Due" value={formatCurrency(totalDue)} tone="neg" icon="💳" />
      </div>

      <div className="flex bg-light-bg border border-border-color rounded-xl p-1 gap-1 mb-5 max-w-sm">
        {(["all", "recurring", "subscriptions"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize ${
              filter === f ? "text-white" : "text-text-secondary"
            }`}
            style={filter === f ? { background: "linear-gradient(135deg, var(--primary-light), var(--primary-dark))" } : undefined}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <p className="text-text-tertiary text-sm italic">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill</th>
                <th>Category</th>
                <th>Due Day</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center italic text-text-tertiary py-7">
                    No bills yet.
                  </td>
                </tr>
              )}
              {filtered.map((b) => (
                <tr key={b._id}>
                  <td className="font-semibold text-text-primary">
                    {b.name}
                    {b.isSubscription && <span className="badge badge-info ml-2">Sub</span>}
                    {b.autopay && <span className="badge badge-gold ml-2">Autopay</span>}
                  </td>
                  <td>{b.category}</td>
                  <td>Day {b.dueDay}</td>
                  <td className="font-bold text-text-primary">{formatCurrency(b.amount)}</td>
                  <td>
                    <span className={`badge ${b.paidThisMonth ? "badge-income" : "badge-expense"}`}>
                      {b.paidThisMonth ? "Paid" : "Due"}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2 items-center">
                      {!b.paidThisMonth && (
                        <button className="btn btn-primary py-1.5 px-3 text-xs" onClick={() => handlePay(b._id)}>
                          Mark Paid
                        </button>
                      )}
                      <button
                        className="text-primary text-xs font-bold"
                        onClick={() => {
                          setEditing(b);
                          setShowModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(b._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showModal && (
        <BillFormModal
          bill={editing}
          accounts={accounts}
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

function BillFormModal({
  bill,
  accounts,
  onClose,
  onSaved,
}: {
  bill: Bill | null;
  accounts: Account[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(bill?.name ?? "");
  const [company, setCompany] = useState(bill?.company ?? "");
  const [category, setCategory] = useState(bill?.category ?? "Utilities");
  const [amount, setAmount] = useState(bill ? String(bill.amount) : "");
  const [dueDay, setDueDay] = useState(bill ? String(bill.dueDay) : "1");
  const [frequency, setFrequency] = useState(bill?.frequency ?? "Monthly");
  const [isSubscription, setIsSubscription] = useState(bill?.isSubscription ?? false);
  const [autopay, setAutopay] = useState(bill?.autopay ?? false);
  const [accountId, setAccountId] = useState(bill?.accountId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      name,
      company,
      category,
      amount: Number(amount),
      dueDay: Number(dueDay),
      frequency,
      isSubscription,
      autopay,
      accountId: accountId || null,
    };

    const res = await fetch(bill ? `/api/bills/${bill._id}` : "/api/bills", {
      method: bill ? "PATCH" : "POST",
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
    <Modal title={bill ? "Edit Bill" : "Add Bill"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-sm text-danger font-semibold mb-3">{error}</p>}
        <div className="mb-4">
          <label className="form-label">Name</label>
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label className="form-label">Company (optional)</label>
          <input className="form-input" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="form-label">Category</label>
          <input className="form-input" value={category} onChange={(e) => setCategory(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="form-label">Amount (₹)</label>
            <input type="number" step="0.01" min="0.01" className="form-input" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Due Day</label>
            <input type="number" min="1" max="31" className="form-input" value={dueDay} onChange={(e) => setDueDay(e.target.value)} required />
          </div>
        </div>
        <div className="mb-4">
          <label className="form-label">Frequency</label>
          <select className="form-select" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            {BILL_FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="form-label">Pay From Account (optional)</label>
          <select className="form-select" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">No account</option>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-5 mb-5">
          <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <input type="checkbox" checked={isSubscription} onChange={(e) => setIsSubscription(e.target.checked)} />
            Subscription
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <input type="checkbox" checked={autopay} onChange={(e) => setAutopay(e.target.checked)} />
            Autopay
          </label>
        </div>
        <button className="btn btn-primary w-full justify-center" disabled={saving}>
          {saving ? "Saving…" : "💾 Save Bill"}
        </button>
      </form>
    </Modal>
  );
}

export default function BillsPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
