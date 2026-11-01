import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { Transaction } from "@/models/Transaction";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { getDefaultMonth, monthToUtcRange, shiftMonth } from "@/lib/month";
import { buildCalendarItems } from "@/lib/calendarAggregate";

const TIMELINE_DAYS = 14;

export async function GET() {
  try {
    const { userId } = await requireSession();
    await dbConnect();
    const uid = new Types.ObjectId(userId);

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const dayStart = new Date(`${todayStr}T00:00:00.000Z`);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const currentMonth = getDefaultMonth();
    const currentRange = monthToUtcRange(currentMonth);
    const nextRange = monthToUtcRange(shiftMonth(currentMonth, 1));

    const [currentItems, nextItems, todaysTransactions] = await Promise.all([
      buildCalendarItems(userId, currentRange.start, currentRange.end),
      buildCalendarItems(userId, nextRange.start, nextRange.end),
      Transaction.find({ userId: uid, date: { $gte: dayStart, $lt: dayEnd } }).sort({ createdAt: -1 }).lean(),
    ]);

    const allItems = [...currentItems, ...nextItems];
    const windowEnd = new Date(dayStart.getTime() + TIMELINE_DAYS * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const dueToday = allItems.filter((i) => i.date === todayStr);
    const upcoming = allItems
      .filter((i) => i.date > todayStr && i.date <= windowEnd)
      .sort((a, b) => a.date.localeCompare(b.date));

    const netToday = todaysTransactions.reduce(
      (sum, t) => sum + (t.type === "income" ? t.amount : -t.amount),
      0
    );

    return NextResponse.json({
      date: todayStr,
      transactions: todaysTransactions,
      dueToday,
      upcoming,
      netToday,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
