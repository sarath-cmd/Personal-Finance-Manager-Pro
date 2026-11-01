// Shared enums — kept here (not in /models) so client components can
// import them without pulling Mongoose into the browser bundle.
export const ACCOUNT_TYPES = [
  "Checking",
  "Savings",
  "Cash",
  "Credit Card",
  "Investment",
  "Retirement",
] as const;

export const TRANSACTION_TYPES = ["income", "expense"] as const;
export const INCOME_STATUSES = ["Received", "Pending"] as const;
export const CLASSIFICATIONS = ["Need", "Want", "Unclassified"] as const;
export const LENDING_ENTRY_TYPES = ["lent", "returned"] as const;

export const TAG_KINDS = ["expense", "income"] as const;
export const BILL_FREQUENCIES = ["Monthly", "Quarterly", "Yearly"] as const;
export const EVENT_TYPES = ["Recurring", "One-time", "Income"] as const;
export const SAVINGS_GOAL_KINDS = ["goal", "sinking_fund", "emergency_fund"] as const;
export const DEBT_TYPES = [
  "Credit Card",
  "Student Loan",
  "Auto Loan",
  "Personal Loan",
  "Mortgage",
  "Other",
] as const;

export const SAVINGS_GOAL_KIND_LABELS: Record<(typeof SAVINGS_GOAL_KINDS)[number], string> = {
  goal: "Savings Goal",
  sinking_fund: "Sinking Fund",
  emergency_fund: "Emergency Fund",
};

export const TAG_PALETTE = [
  "#0e7c66",
  "#c9a15a",
  "#ef4444",
  "#8b5cf6",
  "#0891b2",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#3b82f6",
  "#64748b",
];

export function colorForTagName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[hash % TAG_PALETTE.length];
}

export const DEFAULT_CATEGORIES = [
  "Housing",
  "Rent / Mortgage",
  "Utilities",
  "Groceries",
  "Dining",
  "Transportation",
  "Fuel",
  "Auto",
  "Insurance",
  "Healthcare",
  "Personal Care",
  "Entertainment",
  "Subscriptions",
  "Shopping",
  "Gifts",
  "Pets",
  "Kids & Family",
  "Education",
  "Travel",
  "Debt Payments",
  "Savings & Investments",
  "Miscellaneous",
  "Other",
];

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Gift",
  "Refund",
  "Other",
];

export const CURRENCY = "₹";

export function formatCurrency(amount: number): string {
  return CURRENCY + (Number(amount) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}
