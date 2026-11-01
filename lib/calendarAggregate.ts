import { Types } from "mongoose";
import { Bill } from "@/models/Bill";
import { Event } from "@/models/Event";
import { Debt } from "@/models/Debt";
import { Task } from "@/models/Task";
import { Transaction } from "@/models/Transaction";

export type CalendarItem = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  subtitle?: string;
  amount?: number;
  kind: "bill" | "subscription" | "income" | "debt" | "task" | "event";
  done?: boolean;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function daysInMonth(year: number, month1to12: number) {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

/**
 * Builds the set of calendar-relevant items (bill/subscription/debt due
 * dates projected into the given month, plus one-time events and tasks)
 * for a user. Shared by /api/calendar and /api/today so the projection
 * logic for recurring due-days lives in exactly one place.
 */
export async function buildCalendarItems(
  userId: string,
  start: Date,
  end: Date
): Promise<CalendarItem[]> {
  const uid = new Types.ObjectId(userId);
  const year = start.getUTCFullYear();
  const month1to12 = start.getUTCMonth() + 1;
  const lastDay = daysInMonth(year, month1to12);

  const [bills, events, debts, tasks, paidBillIds] = await Promise.all([
    Bill.find({ userId, active: true }).lean(),
    Event.find({ userId, date: { $gte: start, $lt: end } }).lean(),
    Debt.find({ userId, dueDay: { $ne: null } }).lean(),
    Task.find({ userId, date: { $gte: start, $lt: end } }).lean(),
    Transaction.distinct("billId", { userId: uid, billId: { $ne: null }, date: { $gte: start, $lt: end } }),
  ]);

  const paidSet = new Set(paidBillIds.map((id) => String(id)));
  const items: CalendarItem[] = [];

  for (const bill of bills) {
    const day = Math.min(bill.dueDay, lastDay);
    items.push({
      id: String(bill._id),
      date: `${year}-${pad(month1to12)}-${pad(day)}`,
      title: bill.name,
      subtitle: bill.category,
      amount: bill.amount,
      kind: bill.isSubscription ? "subscription" : "bill",
      done: paidSet.has(String(bill._id)),
    });
  }

  for (const debt of debts) {
    if (!debt.dueDay) continue;
    const day = Math.min(debt.dueDay, lastDay);
    items.push({
      id: String(debt._id),
      date: `${year}-${pad(month1to12)}-${pad(day)}`,
      title: `${debt.name} payment due`,
      subtitle: debt.type,
      amount: debt.minPayment || undefined,
      kind: "debt",
    });
  }

  for (const event of events) {
    items.push({
      id: String(event._id),
      date: event.date.toISOString().slice(0, 10),
      title: event.name,
      subtitle: event.type,
      amount: event.amount,
      kind: event.type === "Income" ? "income" : "event",
    });
  }

  for (const task of tasks) {
    items.push({
      id: String(task._id),
      date: task.date.toISOString().slice(0, 10),
      title: task.name,
      kind: "task",
      done: task.done,
    });
  }

  return items.sort((a, b) => a.date.localeCompare(b.date));
}
