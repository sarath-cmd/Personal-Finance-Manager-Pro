import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { Debt } from "@/models/Debt";
import { DebtPayment } from "@/models/DebtPayment";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { debtInputSchema } from "@/lib/zodSchemas";

export async function GET() {
  try {
    const { userId } = await requireSession();
    await dbConnect();
    const uid = new Types.ObjectId(userId);

    const debts = await Debt.find({ userId }).sort({ createdAt: 1 }).lean();

    const totals = await DebtPayment.aggregate([
      { $match: { userId: uid } },
      { $group: { _id: "$debtId", total: { $sum: "$amount" } } },
    ]);
    const paidByDebt = new Map(totals.map((t) => [String(t._id), t.total]));

    const debtsWithBalance = debts.map((d) => {
      const paid = paidByDebt.get(String(d._id)) ?? 0;
      return { ...d, paidToDate: paid, remainingBalance: Math.max(d.openingBalance - paid, 0) };
    });

    return NextResponse.json({ debts: debtsWithBalance });
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
    const parsed = debtInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await dbConnect();
    const debt = await Debt.create({ ...parsed.data, userId });
    return NextResponse.json(
      { debt: { ...debt.toObject(), paidToDate: 0, remainingBalance: debt.openingBalance } },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
