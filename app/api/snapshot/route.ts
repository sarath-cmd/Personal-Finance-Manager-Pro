import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { Account } from "@/models/Account";
import { Budget } from "@/models/Budget";
import { Debt } from "@/models/Debt";
import { DebtPayment } from "@/models/DebtPayment";
import { SnapshotNote } from "@/models/SnapshotNote";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { getActiveMonth, monthToUtcRange, shiftMonth } from "@/lib/month";
import { snapshotNoteInputSchema, monthQuerySchema } from "@/lib/zodSchemas";

async function expenseTotal(uid: Types.ObjectId, start: Date, end: Date) {
  const rows = await Transaction.aggregate([
    { $match: { userId: uid, type: "expense", date: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return rows[0]?.total ?? 0;
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireSession();
    const url = new URL(req.url);
    const parsedMonth = monthQuerySchema.safeParse(url.searchParams.get("month"));
    const month = getActiveMonth(parsedMonth.success ? parsedMonth.data : undefined);
    const { start, end } = monthToUtcRange(month);
    const prior = monthToUtcRange(shiftMonth(month, -1));

    await dbConnect();
    const uid = new Types.ObjectId(userId);

    const [totals, priorExpense, netWorthRows, budgetRows, debts, debtPaymentRows, note, debtPaymentsThisMonth] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId: uid, date: { $gte: start, $lt: end } } },
        { $group: { _id: "$type", total: { $sum: "$amount" } } },
      ]),
      expenseTotal(uid, prior.start, prior.end),
      Account.aggregate([
        { $match: { userId: uid } },
        {
          $group: {
            _id: null,
            assets: { $sum: { $cond: [{ $ne: ["$type", "Credit Card"] }, "$balance", 0] } },
            liabilities: { $sum: { $cond: [{ $eq: ["$type", "Credit Card"] }, "$balance", 0] } },
          },
        },
      ]),
      Budget.aggregate([
        { $match: { userId: uid, month } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Debt.find({ userId }).lean(),
      DebtPayment.aggregate([{ $match: { userId: uid } }, { $group: { _id: "$debtId", total: { $sum: "$amount" } } }]),
      SnapshotNote.findOne({ userId, month }).lean(),
      DebtPayment.aggregate([
        { $match: { userId: uid, date: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const income = totals.find((t) => t._id === "income")?.total ?? 0;
    const expense = totals.find((t) => t._id === "expense")?.total ?? 0;
    const assets = netWorthRows[0]?.assets ?? 0;
    const liabilities = netWorthRows[0]?.liabilities ?? 0;
    const budgetTotal = budgetRows[0]?.total ?? 0;

    const paidByDebt = new Map(debtPaymentRows.map((r) => [String(r._id), r.total]));
    const debtRemaining = debts.reduce(
      (sum, d) => sum + Math.max(d.openingBalance - (paidByDebt.get(String(d._id)) ?? 0), 0),
      0
    );

    return NextResponse.json({
      month,
      income,
      expense,
      savings: income - expense,
      debt: debtRemaining,
      assets,
      liabilities,
      netWorth: assets - liabilities,
      cashflow: income - expense,
      budgetUsedPct: budgetTotal > 0 ? Math.round((expense / budgetTotal) * 100) : 0,
      savingsRatePct: income > 0 ? Math.round(((income - expense) / income) * 100) : 0,
      debtPaidThisMonth: debtPaymentsThisMonth[0]?.total ?? 0,
      expenseChangePct: priorExpense > 0 ? Math.round(((expense - priorExpense) / priorExpense) * 100) : null,
      note: note ?? { wentWell: "", changed: "" },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await requireSession();
    const body = await req.json().catch(() => null);
    const parsed = snapshotNoteInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await dbConnect();
    const note = await SnapshotNote.findOneAndUpdate(
      { userId, month: parsed.data.month },
      { $set: { wentWell: parsed.data.wentWell, changed: parsed.data.changed } },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ note });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
