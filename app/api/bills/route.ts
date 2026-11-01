import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Bill } from "@/models/Bill";
import { Transaction } from "@/models/Transaction";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { billInputSchema } from "@/lib/zodSchemas";
import { getActiveMonth, monthToUtcRange } from "@/lib/month";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireSession();
    const url = new URL(req.url);
    const month = getActiveMonth(url.searchParams.get("month"));
    const { start, end } = monthToUtcRange(month);

    await dbConnect();

    const [bills, paidBillIds] = await Promise.all([
      Bill.find({ userId }).sort({ dueDay: 1 }).lean(),
      Transaction.distinct("billId", { userId, billId: { $ne: null }, date: { $gte: start, $lt: end } }),
    ]);

    const paidSet = new Set(paidBillIds.map((id) => String(id)));
    const billsWithStatus = bills.map((b) => ({ ...b, paidThisMonth: paidSet.has(String(b._id)) }));

    return NextResponse.json({ month, bills: billsWithStatus });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireSession();
    const body = await req.json().catch(() => null);
    const parsed = billInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await dbConnect();
    const bill = await Bill.create({ ...parsed.data, userId });
    return NextResponse.json({ bill }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
