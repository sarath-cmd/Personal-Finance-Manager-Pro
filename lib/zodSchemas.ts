import { z } from "zod";
import {
  ACCOUNT_TYPES,
  TRANSACTION_TYPES,
  INCOME_STATUSES,
  CLASSIFICATIONS,
  LENDING_ENTRY_TYPES,
  PAYMENT_METHODS,
  TAG_KINDS,
  BILL_FREQUENCIES,
  EVENT_TYPES,
  SAVINGS_GOAL_KINDS,
  DEBT_TYPES,
} from "@/lib/constants";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid id");

export const monthQuerySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
  .optional()
  .nullable();

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

// Min 10 chars, at least one letter and one number.
export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128)
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const accountInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: z.enum(ACCOUNT_TYPES),
  institution: z.string().trim().max(100).optional().default(""),
  balance: z.number().finite(),
});

// Balance is intentionally excluded from PATCH — once an account exists,
// its balance is only ever mutated by the transaction balance-sync logic
// (lib/balance.ts) so it can never drift from the transaction history.
export const accountPatchSchema = accountInputSchema.omit({ balance: true }).partial();

export const transactionInputSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  description: z.string().trim().min(1).max(200),
  amount: z.number().positive().max(1_000_000_000),
  category: z.string().trim().min(1).max(100),
  accountId: objectId.optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]),
  paymentMethod: z.enum(PAYMENT_METHODS).optional().nullable(),
  status: z.enum(INCOME_STATUSES).optional(),
  classification: z.enum(CLASSIFICATIONS).optional(),
});

export const transactionPatchSchema = transactionInputSchema.partial();

export const transactionQuerySchema = z.object({
  month: monthQuerySchema,
  type: z.enum(["income", "expense", "all"]).optional().default("all"),
  category: z.string().trim().max(100).optional(),
});

export const lendingGroupInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  note: z.string().trim().max(500).optional().default(""),
});

export const lendingGroupPatchSchema = lendingGroupInputSchema.partial();

export const lendingPersonInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  note: z.string().trim().max(500).optional().default(""),
  groupId: objectId.optional().nullable(),
});

export const lendingPersonPatchSchema = lendingPersonInputSchema.partial();

export const lendingEntryInputSchema = z.object({
  personId: objectId,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  type: z.enum(LENDING_ENTRY_TYPES),
  amount: z.number().positive().max(1_000_000_000),
  note: z.string().trim().max(500).optional().default(""),
});

export const lendingEntryPatchSchema = lendingEntryInputSchema.partial().extend({
  personId: objectId.optional(),
});

export const lendingEntryQuerySchema = z.object({
  personId: objectId.optional(),
  month: monthQuerySchema,
});

// ---------- Categories & Tags ----------

export const categoryInputSchema = z.object({
  kind: z.enum(TAG_KINDS),
  name: z.string().trim().min(1).max(60),
});

export const tagInputSchema = z.object({
  kind: z.enum(TAG_KINDS),
  name: z.string().trim().min(1).max(40),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "Invalid color"),
});

export const tagPatchSchema = tagInputSchema.partial();

// ---------- Budgets ----------

export const budgetUpsertSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  category: z.string().trim().min(1).max(100),
  amount: z.number().min(0).max(1_000_000_000),
});

// ---------- Bills ----------

export const billInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  company: z.string().trim().max(100).optional().default(""),
  category: z.string().trim().min(1).max(100),
  amount: z.number().positive().max(1_000_000_000),
  dueDay: z.number().int().min(1).max(31),
  frequency: z.enum(BILL_FREQUENCIES),
  isSubscription: z.boolean().optional().default(false),
  autopay: z.boolean().optional().default(false),
  accountId: objectId.optional().nullable(),
  active: z.boolean().optional().default(true),
});

export const billPatchSchema = billInputSchema.partial();

export const billPaySchema = z.object({
  date: dateSchema,
});

// ---------- Calendar events & tasks ----------

export const eventInputSchema = z.object({
  date: dateSchema,
  name: z.string().trim().min(1).max(150),
  type: z.enum(EVENT_TYPES),
  amount: z.number().positive().max(1_000_000_000),
});

export const taskInputSchema = z.object({
  name: z.string().trim().min(1).max(150),
  date: dateSchema,
});

export const taskPatchSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  date: dateSchema.optional(),
  done: z.boolean().optional(),
});

// ---------- Savings ----------

export const savingsGoalInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  kind: z.enum(SAVINGS_GOAL_KINDS),
  targetAmount: z.number().min(0).max(1_000_000_000),
  targetDate: dateSchema.optional().nullable(),
  note: z.string().trim().max(500).optional().default(""),
  active: z.boolean().optional().default(true),
});

export const savingsGoalPatchSchema = savingsGoalInputSchema.partial();

export const savingsContributionInputSchema = z.object({
  goalId: objectId,
  date: dateSchema,
  amount: z.number().positive().max(1_000_000_000),
  note: z.string().trim().max(500).optional().default(""),
});

export const savingsContributionPatchSchema = savingsContributionInputSchema.partial().extend({
  goalId: objectId.optional(),
});

export const savingsContributionQuerySchema = z.object({
  goalId: objectId.optional(),
  month: monthQuerySchema,
});

// ---------- Debt ----------

export const debtInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: z.enum(DEBT_TYPES),
  openingBalance: z.number().min(0).max(1_000_000_000),
  interestRate: z.number().min(0).max(100).optional().default(0),
  minPayment: z.number().min(0).max(1_000_000_000).optional().default(0),
  dueDay: z.number().int().min(1).max(31).optional().nullable(),
});

export const debtPatchSchema = debtInputSchema.partial();

export const debtPaymentInputSchema = z.object({
  debtId: objectId,
  date: dateSchema,
  amount: z.number().positive().max(1_000_000_000),
  note: z.string().trim().max(500).optional().default(""),
});

export const debtPaymentPatchSchema = debtPaymentInputSchema.partial().extend({
  debtId: objectId.optional(),
});

export const debtPaymentQuerySchema = z.object({
  debtId: objectId.optional(),
  month: monthQuerySchema,
});

// ---------- Snapshot notes ----------

export const snapshotNoteInputSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  wentWell: z.string().trim().max(2000).optional().default(""),
  changed: z.string().trim().max(2000).optional().default(""),
});

// ---------- Settings ----------

export const profilePatchSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
});

export { objectId };
