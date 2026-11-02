"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import StatTile from "@/components/dashboard/StatTile";
import TransferFormModal, { type Transfer } from "@/components/accounts/TransferFormModal";
import { SkeletonTableRows } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate, ACCOUNT_TYPES } from "@/lib/constants";

const TYPE_ICON: Record<string, string> = {
  Checking: "💳",
  Savings: "🐷",
  Cash: "💵",
  "Credit Card": "💳",
  Investment: "📈",
  Retirement: "🏖️",
};

type Account = {
  _id: string;
  name: string;
  type: string;
  institution?: string;
  balance: number;
};

function Inner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const month = searchParams.get("month") ?? "";
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    const [acctRes, transferRes] = await Promise.all([
      fetch("/api/accounts"),
      fetch(`/api/transfers?${params.toString()}`),
    ]);
    const acctData = await acctRes.json();
    const transferData = await transferRes.json();
    setAccounts(acctData.accounts ?? []);
    setTransfers(transferData.transfers ?? []);
    setLoading(false);
  }, [month]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch synced to the month param
    load();
  }, [load]);

  useEffect(() => {
    const flag = searchParams.get("new");
    if (flag === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- opening the quick-add modal from a URL flag set by the global FAB
      setEditing(null);
      setShowModal(true);
      router.replace("/accounts");
    } else if (flag === "transfer") {
      setEditingTransfer(null);
      setShowTransferModal(true);
      router.replace("/accounts");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when the `new` param changes
  }, [searchParams]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this account?")) return;
    const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Could not delete account");
      return;
    }
    load();
  }

  async function handleDeleteTransfer(id: string) {
    if (!confirm("Delete this transfer? Both account balances will be reversed.")) return;
    const res = await fetch(`/api/transfers/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Could not delete transfer");
      return;
    }
    load();
  }

  const accountById = new Map(accounts.map((a) => [a._id, a]));

  const totalAssets = accounts
    .filter((a) => a.type !== "Credit Card")
    .reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = accounts
    .filter((a) => a.type === "Credit Card")
    .reduce((s, a) => s + a.balance, 0);

  return (
    <div>
      <PageHeader
        icon="🏦"
        title="Accounts"
        subtitle="Manually tracked accounts — no bank login or card numbers collected."
        action={
          <div className="flex gap-2">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setEditingTransfer(null);
                setShowTransferModal(true);
              }}
              disabled={accounts.length < 2}
            >
              ⇄ Transfer
            </button>
            <button
              className="btn btn-gold"
              onClick={() => {
                setEditing(null);
                setShowModal(true);
              }}
            >
              + Add Account
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatTile label="Total Assets" value={formatCurrency(totalAssets)} tone="pos" icon="🏦" />
        <StatTile label="Credit Card Balances" value={formatCurrency(totalLiabilities)} tone="neg" icon="💳" />
        <StatTile label="Accounts" value={String(accounts.length)} tone="gold" icon="🔢" />
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Type</th>
                <th>Institution</th>
                <th>Balance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <SkeletonTableRows rows={4} cols={5} />}
              {!loading && accounts.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center italic text-text-tertiary py-7">
                    No accounts yet.
                  </td>
                </tr>
              )}
              {!loading && accounts.map((a) => (
                <tr key={a._id}>
                  <td className="font-semibold text-text-primary">
                    <div className="flex items-center gap-2.5">
                      <span className={`icon-chip ${a.type === "Credit Card" ? "" : "gold"}`} style={{ width: "1.9rem", height: "1.9rem", fontSize: "0.9rem" }}>
                        {TYPE_ICON[a.type] ?? "💼"}
                      </span>
                      {a.name}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${a.type === "Credit Card" ? "badge-expense" : "badge-info"}`}>{a.type}</span>
                  </td>
                  <td>{a.institution || "-"}</td>
                  <td className={a.type === "Credit Card" ? "text-danger font-bold" : "font-bold text-success"}>
                    {formatCurrency(a.balance)}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="text-primary text-xs font-bold"
                        onClick={() => {
                          setEditing(a);
                          setShowModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(a._id)}
                      >
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

      <div className="card">
        <h2 className="font-extrabold text-text-primary mb-5 flex items-center gap-2">
          <span className="icon-chip">⇄</span>
          Transfers This Month
        </h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>From</th>
                <th>To</th>
                <th>Amount</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <SkeletonTableRows rows={3} cols={6} />}
              {!loading && transfers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center italic text-text-tertiary py-7">
                    No transfers this month yet.
                  </td>
                </tr>
              )}
              {!loading && transfers.map((t) => (
                <tr key={t._id}>
                  <td>{formatDate(t.date)}</td>
                  <td className="font-semibold text-text-primary">
                    {accountById.get(t.fromAccountId)?.name ?? "—"}
                  </td>
                  <td className="font-semibold text-text-primary">
                    {accountById.get(t.toAccountId)?.name ?? "—"}
                  </td>
                  <td className="font-bold text-text-primary">{formatCurrency(t.amount)}</td>
                  <td>{t.note || "-"}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="text-primary text-xs font-bold"
                        onClick={() => {
                          setEditingTransfer(t);
                          setShowTransferModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDeleteTransfer(t._id)}>
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

      {showModal && (
        <AccountFormModal
          account={editing}
          error={error}
          onError={setError}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}

      {showTransferModal && (
        <TransferFormModal
          transfer={editingTransfer}
          accounts={accounts}
          onClose={() => setShowTransferModal(false)}
          onSaved={() => {
            setShowTransferModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}

function AccountFormModal({
  account,
  error,
  onError,
  onClose,
  onSaved,
}: {
  account: Account | null;
  error: string | null;
  onError: (e: string | null) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState(account?.type ?? "Checking");
  const [institution, setInstitution] = useState(account?.institution ?? "");
  const [balance, setBalance] = useState(account ? String(account.balance) : "0");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onError(null);
    setSaving(true);

    const payload: Record<string, unknown> = { name, type, institution };
    if (!account) payload.balance = Number(balance);

    const res = await fetch(account ? `/api/accounts/${account._id}` : "/api/accounts", {
      method: account ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
    <Modal title={account ? "Edit Account" : "Add Account"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-sm text-danger font-semibold mb-3">{error}</p>}
        <div className="mb-4">
          <label className="form-label">Name</label>
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label className="form-label">Type</label>
          <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="form-label">Institution (optional)</label>
          <input className="form-input" value={institution} onChange={(e) => setInstitution(e.target.value)} />
        </div>
        {!account && (
          <div className="mb-4">
            <label className="form-label">Opening Balance (₹)</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
            />
          </div>
        )}
        <button className="btn btn-primary w-full justify-center" disabled={saving}>
          {saving ? "Saving…" : "💾 Save Account"}
        </button>
      </form>
    </Modal>
  );
}
