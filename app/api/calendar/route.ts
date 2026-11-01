import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { getActiveMonth, monthToUtcRange } from "@/lib/month";
import { buildCalendarItems } from "@/lib/calendarAggregate";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireSession();
    const url = new URL(req.url);
    const month = getActiveMonth(url.searchParams.get("month"));
    const { start, end } = monthToUtcRange(month);

    await dbConnect();
    const items = await buildCalendarItems(userId, start, end);

    return NextResponse.json({ month, items });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
