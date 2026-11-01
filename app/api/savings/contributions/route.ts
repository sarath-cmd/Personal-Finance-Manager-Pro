import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { SavingsGoal } from "@/models/SavingsGoal";
import { SavingsContribution } from "@/models/SavingsContribution";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { savingsContributionInputSchema, savingsContributionQuerySchema } from "@/lib/zodSchemas";
import { getActiveMonth, monthToUtcRange } from "@/lib/month";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireSession();
    const url = new URL(req.url);
    const parsedQuery = savingsContributionQuerySchema.safeParse({
      goalId: url.searchParams.get("goalId") ?? undefined,
      month: url.searchParams.get("month"),
    });
    if (!parsedQuery.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    await dbConnect();

    const filter: Record<string, unknown> = { userId };
    if (parsedQuery.data.goalId) filter.goalId = parsedQuery.data.goalId;

    if (url.searchParams.has("month") || !parsedQuery.data.goalId) {
      const month = getActiveMonth(parsedQuery.data.month);
      const { start, end } = monthToUtcRange(month);
      filter.date = { $gte: start, $lt: end };
    }

    const contributions = await SavingsContribution.find(filter).sort({ date: -1, createdAt: -1 }).lean();
    return NextResponse.json({ contributions });
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
    const parsed = savingsContributionInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const input = parsed.data;

    await dbConnect();
    const goal = await SavingsGoal.findOne({ _id: input.goalId, userId }).lean();
    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 400 });
    }

    const contribution = await SavingsContribution.create({
      userId,
      goalId: input.goalId,
      date: new Date(`${input.date}T00:00:00.000Z`),
      amount: input.amount,
      note: input.note ?? "",
    });

    return NextResponse.json({ contribution }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
