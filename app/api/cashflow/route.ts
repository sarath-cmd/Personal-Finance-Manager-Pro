import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { getDefaultMonth, monthToUtcRange, shiftMonth, monthLabel } from "@/lib/month";

const MONTHS_BACK = 6;

export async function GET() {
  try {
    const { userId } = await requireSession();
    await dbConnect();
    const uid = new Types.ObjectId(userId);

    const current = getDefaultMonth();
    const months = Array.from({ length: MONTHS_BACK }, (_, i) =>
      shiftMonth(current, -(MONTHS_BACK - 1 - i))
    );

    const earliest = monthToUtcRange(months[0]).start;
    const latest = monthToUtcRange(months[months.length - 1]).end;

    const rows = await Transaction.aggregate([
      { $match: { userId: uid, date: { $gte: earliest, $lt: latest } } },
      {
        $group: {
          _id: { month: { $dateToString: { format: "%Y-%m", date: "$date" } }, type: "$type" },
          total: { $sum: "$amount" },
        },
      },
    ]);

    const series = months.map((m) => {
      const income = rows.find((r) => r._id.month === m && r._id.type === "income")?.total ?? 0;
      const expense = rows.find((r) => r._id.month === m && r._id.type === "expense")?.total ?? 0;
      return { month: m, label: monthLabel(m), income, expense, net: income - expense };
    });

    return NextResponse.json({ series });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
