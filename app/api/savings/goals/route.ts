import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { SavingsGoal } from "@/models/SavingsGoal";
import { SavingsContribution } from "@/models/SavingsContribution";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { savingsGoalInputSchema } from "@/lib/zodSchemas";

export async function GET() {
  try {
    const { userId } = await requireSession();
    await dbConnect();
    const uid = new Types.ObjectId(userId);

    const goals = await SavingsGoal.find({ userId }).sort({ createdAt: 1 }).lean();

    const totals = await SavingsContribution.aggregate([
      { $match: { userId: uid } },
      { $group: { _id: "$goalId", total: { $sum: "$amount" } } },
    ]);
    const totalByGoal = new Map(totals.map((t) => [String(t._id), t.total]));

    const goalsWithProgress = goals.map((g) => ({
      ...g,
      currentAmount: totalByGoal.get(String(g._id)) ?? 0,
    }));

    return NextResponse.json({ goals: goalsWithProgress });
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
    const parsed = savingsGoalInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await dbConnect();
    const goal = await SavingsGoal.create({
      ...parsed.data,
      userId,
      targetDate: parsed.data.targetDate ? new Date(`${parsed.data.targetDate}T00:00:00.000Z`) : null,
    });
    return NextResponse.json({ goal: { ...goal.toObject(), currentAmount: 0 } }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
