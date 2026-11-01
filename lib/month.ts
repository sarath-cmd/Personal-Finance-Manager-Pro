const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** The real current month, computed fresh on every call — never stored. */
export function getDefaultMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Validates an optional `?month=YYYY-MM` param; falls back to the real current month. */
export function getActiveMonth(monthParam?: string | null): string {
  if (monthParam && MONTH_RE.test(monthParam)) return monthParam;
  return getDefaultMonth();
}

export function isValidMonth(value: string): boolean {
  return MONTH_RE.test(value);
}

export function monthToUtcRange(ym: string): { start: Date; end: Date } {
  const [year, month] = ym.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

export function shiftMonth(ym: string, delta: number): string {
  const [year, month] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(ym: string): string {
  const [year, month] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, 1));
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}
