"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/constants";
import TransactionFormModal, { type Account, type Transaction } from "@/components/transactions/TransactionFormModal";
import PaymentMethodIcon from "@/components/transactions/PaymentMethodIcon";
import PageHeader from "@/components/ui/PageHeader";
import StatTile from "@/components/dashboard/StatTile";
import { SkeletonTableRows } from "@/components/ui/Skeleton";

const CATEGORY_COLORS = ["#0e7c66", "#c9a15a", "#0891b2", "#8b5cf6", "#dc2626", "#f59e0b", "#059669", "#ec4899"];

function Inner({
  type,
  title,
  subtitle,
}: {
  type: "income" | "expense";
  title: string;
  subtitle: string;
}) {
  const searchParams = useSearchParams();
  const month = searchParams.get("month") ?? "";

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    params.set("type", type);

    const [txRes, acctRes] = await Promise.all([
      fetch(`/api/transactions?${params.toString()}`),
      fetch("/api/accounts"),
    ]);
    const txData = await txRes.json();
    const acctData = await acctRes.json();
    setTransactions(txData.transactions ?? []);
    setAccounts(acctData.accounts ?? []);
    setLoading(false);
  }, [month, type]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch synced to month/type
    load();
  }, [load]);

  const total = useMemo(() => transactions.reduce((s, t) => s + t.amount, 0), [transactions]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

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
        icon={type === "income" ? "💵" : "🧾"}
        title={title}
        subtitle={subtitle}
        action={
          <button
            className="btn btn-gold"
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
          >
            + Add {type === "income" ? "Income" : "Expense"}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatTile
          label="This Month"
          value={formatCurrency(total)}
          tone={type === "income" ? "pos" : "neg"}
          icon={type === "income" ? "💵" : "🧾"}
        />
        <StatTile label="Entries" value={String(transactions.length)} tone="gold" icon="🔢" />
      </div>

      {byCategory.length > 0 && (
        <div className="card">
          <h2 className="font-extrabold text-text-primary mb-5 flex items-center gap-2">
            <span className="icon-chip gold">🏷️</span>
            By Category
          </h2>
          <div className="flex flex-col gap-4">
            {byCategory.map(([cat, amt], i) => {
              const pct = total > 0 ? Math.round((amt / total) * 100) : 0;
              const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-semibold text-text-primary flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                      {cat}
                    </span>
                    <span className="text-text-secondary font-bold">{formatCurrency(amt)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-light-bg border border-border-color overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <SkeletonTableRows rows={5} cols={5} />}
              {!loading && transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center italic text-text-tertiary py-7">
                    Nothing recorded this month.
                  </td>
                </tr>
              )}
              {!loading && transactions.map((t) => (
                <tr key={t._id}>
                  <td>{formatDate(t.date)}</td>
                  <td className="font-semibold text-text-primary">
                    {t.description}
                    <PaymentMethodIcon method={t.paymentMethod} />
                  </td>
                  <td>{t.category}</td>
                  <td className={type === "income" ? "font-bold text-success" : "font-bold text-danger"}>
                    {formatCurrency(t.amount)}
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
      </div>

      {showModal && (
        <TransactionFormModal
          transaction={editing}
          accounts={accounts}
          defaultType={type}
          lockType
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

export default function FilteredTransactionsPage(props: {
  type: "income" | "expense";
  title: string;
  subtitle: string;
}) {
  return (
    <Suspense>
      <Inner {...props} />
    </Suspense>
  );
}
