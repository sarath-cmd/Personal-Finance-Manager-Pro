"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TransactionFormModal, { type Account } from "@/components/transactions/TransactionFormModal";

type Action = {
  key: string;
  icon: string;
  label: string;
  href?: string;
};

const ACTIONS: Action[] = [
  { key: "transaction", icon: "💸", label: "Transaction" },
  { key: "account", icon: "🏦", label: "Account", href: "/accounts?new=1" },
  { key: "bill", icon: "📑", label: "Bill", href: "/bills?new=1" },
  { key: "goal", icon: "🎯", label: "Savings Goal", href: "/savings/goals?new=1" },
  { key: "debt", icon: "💳", label: "Debt", href: "/debt?new=1" },
  { key: "person", icon: "🤝", label: "Lent/Borrowed", href: "/lending?new=1" },
  { key: "task", icon: "✅", label: "Task", href: "/today?new=1" },
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

        <div className="relative flex flex-col items-end gap-2">
          {open && (
            <div className="flex flex-col items-stretch gap-1.5 mb-1 animate-[fab-pop_0.15s_ease-out]">
              {ACTIONS.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => handleAction(a)}
                  className="flex items-center gap-2.5 pl-3.5 pr-4 py-2.5 rounded-full shadow-lg text-sm font-semibold text-white whitespace-nowrap hover:brightness-110 transition"
                  style={{
                    background: "linear-gradient(135deg, var(--primary-light), var(--primary-dark))",
                    boxShadow: "var(--shadow-md)",
                  }}
                >
                  <span className="text-base leading-none">{a.icon}</span>
                  {a.label}
                </button>
              ))}
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
