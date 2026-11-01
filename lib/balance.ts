import type { AccountDoc } from "@/models/Account";

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

type TxLike = {
  type: "income" | "expense";
  amount: number;
  status?: "Received" | "Pending";
};

/**
 * Signed balance effect of a transaction on an account.
 * Credit cards hold what you owe, so spending RAISES the balance and
 * paying it off (an income tx against that account) LOWERS it — the
 * opposite of a normal cash/checking/savings account.
 */
export function txDelta(tx: TxLike, account: AccountDoc): number {
  if (tx.type === "income" && (tx.status ?? "Received") !== "Received") return 0;
  let sign = tx.type === "income" ? 1 : -1;
  if (account.type === "Credit Card") sign = -sign;
  return round2(sign * tx.amount);
}
