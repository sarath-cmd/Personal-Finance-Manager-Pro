"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TransactionFormModal, { type Account } from "@/components/transactions/TransactionFormModal";

type Action = {
  key: string;
  icon: string;
  label: string;
  gradient: string;
  glow: string;
  href?: string;
};

const ACTIONS: Action[] = [
  {
    key: "transaction",
    icon: "💸",
    label: "Transaction",
    gradient: "linear-gradient(135deg, var(--primary-light), var(--primary-dark))",
    glow: "rgba(14, 124, 102, 0.35)",
  },
  {
    key: "account",
    icon: "🏦",
    label: "Account",
    href: "/accounts?new=1",
    gradient: "linear-gradient(135deg, #22abc4, var(--info))",
    glow: "rgba(8, 145, 178, 0.35)",
  },
  {
    key: "transfer",
    icon: "⇄",
    label: "Transfer",
    href: "/accounts?new=transfer",
    gradient: "linear-gradient(135deg, #22abc4, var(--info))",
    glow: "rgba(8, 145, 178, 0.35)",
  },
  {
    key: "bill",
    icon: "📑",
    label: "Bill",
    href: "/bills?new=1",
    gradient: "linear-gradient(135deg, var(--gold-light), var(--gold-dark))",
    glow: "rgba(201, 161, 90, 0.35)",
  },
  {
    key: "goal",
    icon: "🎯",
    label: "Savings Goal",
    href: "/savings?new=1",
    gradient: "linear-gradient(135deg, var(--success-light), var(--success))",
    glow: "rgba(5, 150, 105, 0.35)",
  },
  {
    key: "debt",
    icon: "💳",
    label: "Debt",
    href: "/debt?new=1",
    gradient: "linear-gradient(135deg, var(--danger-light), var(--danger))",
    glow: "rgba(220, 38, 38, 0.35)",
  },
  {
    key: "person",
    icon: "🤝",
    label: "Lent/Borrowed",
    href: "/lending?new=1",
    gradient: "linear-gradient(135deg, var(--gold-light), var(--gold-dark))",
    glow: "rgba(201, 161, 90, 0.35)",
  },
  {
    key: "task",
    icon: "✅",
    label: "Task",
    href: "/today?new=1",
    gradient: "linear-gradient(135deg, var(--primary-light), var(--primary-dark))",
    glow: "rgba(14, 124, 102, 0.35)",
  },
];

export default function QuickActionsFab() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  function handleAction(action: Action) {
    setOpen(false);
    if (action.key === "transaction") {
      fetch("/api/accounts")
        .then((r) => r.json())
        .then((data) => setAccounts(data.accounts ?? []))
        .catch(() => setAccounts([]));
      setShowTxModal(true);
      return;
    }
    if (action.href) router.push(action.href);
  }

  return (
    <>
      <div className="hidden lg:block fixed bottom-7 right-7 z-40">
        {open && (
          <button
            type="button"
            aria-label="Close quick actions"
            onClick={() => setOpen(false)}
            className="fixed inset-0 cursor-default"
            style={{ background: "transparent" }}
          />
        )}

        <div className="relative flex flex-col items-end gap-3">
          {open && (
            <div
              className="w-72 rounded-2xl p-4 animate-[fab-pop_0.15s_ease-out]"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <div className="flex items-center justify-between mb-3.5 px-0.5">
                <div>
                  <div className="text-sm font-extrabold text-text-primary">Quick Add</div>
                  <div className="text-xs text-text-tertiary">Jump straight to creating something</div>
                </div>
                <button
                  type="button"
                  aria-label="Close quick actions"
                  onClick={() => setOpen(false)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-light-bg transition flex-shrink-0"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {ACTIONS.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => handleAction(a)}
                    className="flex flex-col items-center gap-2 py-3.5 px-2 rounded-xl text-center transition-colors hover:bg-light-bg"
                    style={{ border: "1px solid var(--border-color)" }}
                  >
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: a.gradient, boxShadow: `0 4px 10px ${a.glow}` }}
                    >
                      {a.icon}
                    </span>
                    <span className="text-xs font-bold text-text-primary leading-tight">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            aria-label={open ? "Close quick actions" : "Quick add"}
            onClick={() => setOpen((v) => !v)}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-transform hover:scale-105"
            style={{
              background: "linear-gradient(135deg, var(--gold-light), var(--gold-dark))",
              boxShadow: "0 8px 20px rgba(201, 161, 90, 0.45)",
              transform: open ? "rotate(45deg)" : "none",
              transition: "transform 0.2s ease",
            }}
          >
            +
          </button>
        </div>
      </div>

      {showTxModal && (
        <TransactionFormModal
          transaction={null}
          accounts={accounts}
          defaultType="expense"
          onClose={() => setShowTxModal(false)}
          onSaved={() => {
            setShowTxModal(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
