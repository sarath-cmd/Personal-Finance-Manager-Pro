"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import StatTile from "@/components/dashboard/StatTile";
import { SkeletonStatRow, SkeletonTableRows } from "@/components/ui/Skeleton";
import {
  formatCurrency,
  formatDate,
  INVESTMENT_KINDS,
  INVESTMENT_KIND_LABELS,
  INVESTMENT_KIND_ICONS,
  INVESTMENT_KIND_QUANTITY_LABELS,
} from "@/lib/constants";

type Kind = (typeof INVESTMENT_KINDS)[number];

type Entry = {
  _id: string;
  date: string;
  kind: Kind;
  amount: number;
  quantity?: number | null;
  note?: string;
};

function Inner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const month = searchParams.get("month") ?? "";

  const [entries, setEntries] = useState<Entry[]>([]);
  const [totalInvested, setTotalInvested] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<"all" | Kind>("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    const res = await fetch(`/api/investments?${params.toString()}`);
    const data = await res.json();
    setEntries(data.entries ?? []);
    setTotalInvested(data.totalInvested ?? {});
    setLoading(false);
  }, [month]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch synced to the month param
    load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- opening the quick-add modal from a URL flag set by the global FAB
      setEditing(null);
      setShowModal(true);
      router.replace(month ? `/investments?month=${month}` : "/investments");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when the `new` param changes
  }, [searchParams]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this investment entry?")) return;
    const res = await fetch(`/api/investments/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Could not delete entry");
      return;
    }
    load();
  }

  const filtered = kindFilter === "all" ? entries : entries.filter((e) => e.kind === kindFilter);
  const totalThisMonth = entries.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <PageHeader
        icon="💰"
        title="Investments"
        subtitle="Track what you've put into Gold, Silver and SIPs, separate from everyday spending."
        action={
          <button
            className="btn btn-gold"
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
          >
            + Add Investment
          </button>
        }
      />

      {loading ? (
        <SkeletonStatRow count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatTile label="Invested This Month" value={formatCurrency(totalThisMonth)} tone="info" icon="💰" />
          <StatTile label="Gold (all time)" value={formatCurrency(totalInvested.gold ?? 0)} tone="gold" icon="🥇" />
          <StatTile label="Silver (all time)" value={formatCurrency(totalInvested.silver ?? 0)} tone="gold" icon="🥈" />
          <StatTile label="SIP (all time)" value={formatCurrency(totalInvested.sip ?? 0)} tone="pos" icon="📈" />
        </div>
      )}

      <div className="flex bg-light-bg border border-border-color rounded-xl p-1 gap-1 mb-6 max-w-lg">
        <button
          type="button"
          onClick={() => setKindFilter("all")}
          className="flex-1 py-2 rounded-lg text-xs font-bold"
          style={kindFilter === "all" ? { background: "linear-gradient(135deg, var(--primary-light), var(--primary-dark))", color: "#fff" } : { color: "var(--text-secondary)" }}
        >
          All
        </button>
        {INVESTMENT_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKindFilter(k)}
            className="flex-1 py-2 rounded-lg text-xs font-bold"
            style={kindFilter === k ? { background: "linear-gradient(135deg, var(--primary-light), var(--primary-dark))", color: "#fff" } : { color: "var(--text-secondary)" }}
          >
            {INVESTMENT_KIND_ICONS[k]} {INVESTMENT_KIND_LABELS[k]}
          </button>
        ))}
      </div>

      <div className="card">
        <h2 className="font-extrabold text-text-primary mb-5 flex items-center gap-2">
          <span className="icon-chip gold">📜</span>
          This Month&apos;s Entries
        </h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Quantity</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <SkeletonTableRows rows={5} cols={6} />}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center italic text-text-tertiary py-7">
                    Nothing recorded this month yet.
                  </td>
                </tr>
              )}
              {!loading && filtered.map((e) => (
                <tr key={e._id}>
                  <td>{formatDate(e.date)}</td>
                  <td>
                    <span className="badge badge-gold">
                      {INVESTMENT_KIND_ICONS[e.kind]} {INVESTMENT_KIND_LABELS[e.kind]}
                    </span>
                  </td>
                  <td className="font-bold text-text-primary">{formatCurrency(e.amount)}</td>
                  <td>{e.quantity ? e.quantity : "-"}</td>
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

      {showModal && (
        <InvestmentFormModal
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

export default function InvestmentsPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}

function InvestmentFormModal({
  entry,
  onClose,
  onSaved,
}: {
  entry: Entry | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(entry?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [kind, setKind] = useState<Kind>(entry?.kind ?? "gold");
  const [amount, setAmount] = useState(entry ? String(entry.amount) : "");
  const [quantity, setQuantity] = useState(entry?.quantity ? String(entry.quantity) : "");
  const [note, setNote] = useState(entry?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      date,
      kind,
      amount: Number(amount),
      quantity: quantity ? Number(quantity) : null,
      note,
    };

    const res = await fetch(entry ? `/api/investments/${entry._id}` : "/api/investments", {
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
    <Modal title={entry ? "Edit Investment" : "Add Investment"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-sm text-danger font-semibold mb-3">{error}</p>}

        <div className="mb-4">
          <label className="form-label">Type</label>
          <div className="flex gap-2">
            {INVESTMENT_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`btn flex-1 justify-center ${kind === k ? "btn-primary" : "btn-secondary opacity-60"}`}
              >
                {INVESTMENT_KIND_ICONS[k]} {INVESTMENT_KIND_LABELS[k]}
              </button>
            ))}
          </div>
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
          <label className="form-label">{INVESTMENT_KIND_QUANTITY_LABELS[kind]}</label>
          <input
            type="number"
            step="0.001"
            min="0"
            className="form-input"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="form-label">Note (optional)</label>
          <input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <button className="btn btn-primary w-full justify-center" disabled={saving}>
          {saving ? "Saving…" : "💾 Save Investment"}
        </button>
      </form>
    </Modal>
  );
}
