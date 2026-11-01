import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { SavingsGoal } from "@/models/SavingsGoal";
import { SavingsContribution } from "@/models/SavingsContribution";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { savingsGoalPatchSchema, objectId } from "@/lib/zodSchemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireSession();
    const { id } = await params;
    if (!objectId.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const parsed = savingsGoalPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.targetDate !== undefined) {
      update.targetDate = parsed.data.targetDate ? new Date(`${parsed.data.targetDate}T00:00:00.000Z`) : null;
    }

    await dbConnect();
    const goal = await SavingsGoal.findOneAndUpdate({ _id: id, userId }, { $set: update }, { new: true }).lean();
    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    return NextResponse.json({ goal });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireSession();
    const { id } = await params;
    if (!objectId.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await dbConnect();
    const deleted = await SavingsGoal.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    await SavingsContribution.deleteMany({ userId, goalId: id });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
