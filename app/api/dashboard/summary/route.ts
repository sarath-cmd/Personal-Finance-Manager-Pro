import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { Account } from "@/models/Account";
import { SavingsContribution } from "@/models/SavingsContribution";
import { Debt } from "@/models/Debt";
import { DebtPayment } from "@/models/DebtPayment";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { getActiveMonth, monthToUtcRange } from "@/lib/month";
import { monthQuerySchema } from "@/lib/zodSchemas";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireSession();
    const url = new URL(req.url);
    const parsedMonth = monthQuerySchema.safeParse(url.searchParams.get("month"));
    const month = getActiveMonth(parsedMonth.success ? parsedMonth.data : undefined);
    const { start, end } = monthToUtcRange(month);

    await dbConnect();

    const uid = new Types.ObjectId(userId);

    const totals = await Transaction.aggregate([
      { $match: { userId: uid, date: { $gte: start, $lt: end } } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]);

    const income = totals.find((t) => t._id === "income")?.total ?? 0;
    const expense = totals.find((t) => t._id === "expense")?.total ?? 0;

    const recentTransactions = await Transaction.find({ userId, date: { $gte: start, $lt: end } })
      .sort({ date: -1, createdAt: -1 })
      .limit(10)
      .lean();

    const netWorth = await Account.aggregate([
      { $match: { userId: uid } },
      {
        $group: {
          _id: null,
          assets: {
            $sum: {
              $cond: [{ $ne: ["$type", "Credit Card"] }, "$balance", 0],
            },
          },
          liabilities: {
            $sum: {
              $cond: [{ $eq: ["$type", "Credit Card"] }, "$balance", 0],
            },
          },
        },
      },
    ]);

    const assets = netWorth[0]?.assets ?? 0;
    const liabilities = netWorth[0]?.liabilities ?? 0;

    const [savingsRows, debts, debtPaidRows] = await Promise.all([
      SavingsContribution.aggregate([
        { $match: { userId: uid, date: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Debt.find({ userId }).lean(),
      DebtPayment.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: "$debtId", total: { $sum: "$amount" } } },
      ]),
    ]);

    const paidByDebt = new Map(debtPaidRows.map((r) => [String(r._id), r.total]));
    const debtRemaining = debts.reduce(
      (sum, d) => sum + Math.max(d.openingBalance - (paidByDebt.get(String(d._id)) ?? 0), 0),
      0
    );
    const debtPaidThisMonthRows = await DebtPayment.aggregate([
      { $match: { userId: uid, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return NextResponse.json({
      month,
      income,
      expense,
      remaining: income - expense,
      savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : 0,
      assets,
      liabilities,
      netWorth: assets - liabilities,
      savingsThisMonth: savingsRows[0]?.total ?? 0,
      debtRemaining,
      debtPaidThisMonth: debtPaidThisMonthRows[0]?.total ?? 0,
      recentTransactions,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
