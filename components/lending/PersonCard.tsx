import Link from "next/link";
import { formatCurrency } from "@/lib/constants";

const AVATAR_COLORS = [
  ["#14a085", "#095c4b"],
  ["#e2c07f", "#a9803f"],
  ["#0891b2", "#095c4b"],
  ["#8b5cf6", "#4c1d95"],
  ["#ef4444", "#991b1b"],
  ["#f59e0b", "#92400e"],
];

export function avatarGradient(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const [from, to] = AVATAR_COLORS[idx];
  return `linear-gradient(135deg, ${from}, ${to})`;
}

export type Person = {
  _id: string;
  name: string;
  note?: string;
  lent: number;
  returned: number;
  balance: number;
  groupId?: string | null;
};

export default function PersonCard({ person: p, onDelete }: { person: Person; onDelete: (id: string) => void }) {
  return (
    <div className="card mb-0! relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{
          background:
            p.balance > 0
              ? "linear-gradient(90deg, var(--danger-light), var(--danger))"
              : p.balance < 0
              ? "linear-gradient(90deg, var(--success-light), var(--success))"
              : "linear-gradient(90deg, var(--gold-light), var(--gold-dark))",
        }}
      />
      <div className="flex items-start justify-between mb-3">
        <Link href={`/lending/${p._id}`} className="flex items-center gap-2.5 group">
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-xs flex-shrink-0"
            style={{ background: avatarGradient(p.name) }}
          >
            {p.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="font-extrabold text-text-primary group-hover:text-primary">{p.name}</span>
        </Link>
        <button className="text-text-tertiary text-sm" onClick={() => onDelete(p._id)}>
          🗑️
        </button>
      </div>
      <div
        className={`text-xl font-black mb-1 ${
          p.balance > 0 ? "text-danger" : p.balance < 0 ? "text-success" : "text-text-primary"
        }`}
      >
        {formatCurrency(Math.abs(p.balance))}
      </div>
      <div className="text-xs text-text-tertiary mb-4">
        {p.balance > 0 ? "owes you" : p.balance < 0 ? "you owe them" : "settled up"}
      </div>
      <div className="flex justify-between text-xs text-text-secondary">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-danger" />
          Lent: {formatCurrency(p.lent)}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          Returned: {formatCurrency(p.returned)}
        </span>
      </div>
      <Link href={`/lending/${p._id}`} className="btn btn-secondary w-full justify-center mt-4 text-xs py-2">
        View history
      </Link>
    </div>
  );
}
