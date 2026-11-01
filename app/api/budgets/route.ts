import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { Budget } from "@/models/Budget";
import { Transaction } from "@/models/Transaction";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { budgetUpsertSchema } from "@/lib/zodSchemas";
import { getActiveMonth, monthToUtcRange } from "@/lib/month";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireSession();
    const url = new URL(req.url);
    const month = getActiveMonth(url.searchParams.get("month"));
    const { start, end } = monthToUtcRange(month);

    await dbConnect();
    const uid = new Types.ObjectId(userId);

    const [budgets, spentRows] = await Promise.all([
      Budget.find({ userId, month }).lean(),
      Transaction.aggregate([
        { $match: { userId: uid, type: "expense", date: { $gte: start, $lt: end } } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
      ]),
    ]);

    const spentByCategory: Record<string, number> = {};
    for (const row of spentRows) spentByCategory[row._id] = row.total;

    return NextResponse.json({ month, budgets, spentByCategory });
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
    const parsed = budgetUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await dbConnect();
    const budget = await Budget.findOneAndUpdate(
      { userId, month: parsed.data.month, category: parsed.data.category },
      { $set: { amount: parsed.data.amount } },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ budget });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
