"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/constants";
import TransactionFormModal, { type Account, type Transaction } from "@/components/transactions/TransactionFormModal";
import PageHeader from "@/components/ui/PageHeader";

function TransactionsInner() {
  const searchParams = useSearchParams();
  const month = searchParams.get("month") ?? "";

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (typeFilter !== "all") params.set("type", typeFilter);

    const [txRes, acctRes] = await Promise.all([
      fetch(`/api/transactions?${params.toString()}`),
      fetch("/api/accounts"),
    ]);
    const txData = await txRes.json();
    const acctData = await acctRes.json();
    setTransactions(txData.transactions ?? []);
    setAccounts(acctData.accounts ?? []);
    setLoading(false);
  }, [month, typeFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch synced to month/type filters
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Could not delete transaction");
      return;
    }
    load();
  }

  return (
    <div>
      <PageHeader
        icon="📜"
        title="Transactions"
        subtitle="Every income and expense entry in one ledger."
        action={
          <button
            className="btn btn-gold"
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
          >
            + Add Transaction
          </button>
        }
      />

      <div className="card">
        <div className="flex gap-3 mb-5">
          <select
            className="form-select max-w-[180px]"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All types</option>
            <option value="income">Income only</option>
            <option value="expense">Expense only</option>
          </select>
        </div>

        {loading ? (
          <p className="text-text-tertiary text-sm italic">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center italic text-text-tertiary py-7">
                    No transactions for this month yet.
                  </td>
                </tr>
              )}
              {transactions.map((t) => (
                <tr key={t._id}>
                  <td>{formatDate(t.date)}</td>
                  <td className="font-semibold text-text-primary">{t.description}</td>
                  <td>{t.category}</td>
                  <td className={t.type === "income" ? "font-bold text-success" : "font-bold text-danger"}>
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </td>
                  <td>
                    <span className={`badge ${t.type === "income" ? "badge-income" : "badge-expense"}`}>
                      {t.type}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="text-primary text-xs font-bold"
                        onClick={() => {
                          setEditing(t);
                          setShowModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(t._id)}>
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
        <TransactionFormModal
          transaction={editing}
          accounts={accounts}
          defaultType="expense"
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

export default function TransactionsPage() {
  return (
    <Suspense>
      <TransactionsInner />
    </Suspense>
  );
}
