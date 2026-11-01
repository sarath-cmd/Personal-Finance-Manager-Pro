import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { eventInputSchema } from "@/lib/zodSchemas";
import { getActiveMonth, monthToUtcRange } from "@/lib/month";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireSession();
    const url = new URL(req.url);
    const month = getActiveMonth(url.searchParams.get("month"));
    const { start, end } = monthToUtcRange(month);

    await dbConnect();
    const events = await Event.find({ userId, date: { $gte: start, $lt: end } })
      .sort({ date: 1 })
      .lean();
    return NextResponse.json({ month, events });
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
    const parsed = eventInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await dbConnect();
    const event = await Event.create({
      userId,
      date: new Date(`${parsed.data.date}T00:00:00.000Z`),
      name: parsed.data.name,
      type: parsed.data.type,
      amount: parsed.data.amount,
    });
    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
