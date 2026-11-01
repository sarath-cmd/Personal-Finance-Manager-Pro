import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { taskInputSchema } from "@/lib/zodSchemas";
import { getActiveMonth, monthToUtcRange } from "@/lib/month";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireSession();
    const url = new URL(req.url);
    const month = getActiveMonth(url.searchParams.get("month"));
    const { start, end } = monthToUtcRange(month);

    await dbConnect();
    const tasks = await Task.find({ userId, date: { $gte: start, $lt: end } })
      .sort({ date: 1 })
      .lean();
    return NextResponse.json({ month, tasks });
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
    const parsed = taskInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await dbConnect();
    const task = await Task.create({
      userId,
      name: parsed.data.name,
      date: new Date(`${parsed.data.date}T00:00:00.000Z`),
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
