import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { SavingsGoal } from "@/models/SavingsGoal";
import { SavingsContribution } from "@/models/SavingsContribution";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { savingsContributionPatchSchema, objectId } from "@/lib/zodSchemas";

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
    const parsed = savingsContributionPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await dbConnect();

    if (parsed.data.goalId) {
      const goal = await SavingsGoal.findOne({ _id: parsed.data.goalId, userId }).lean();
      if (!goal) {
        return NextResponse.json({ error: "Goal not found" }, { status: 400 });
      }
    }

    const update: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.date) update.date = new Date(`${parsed.data.date}T00:00:00.000Z`);

    const contribution = await SavingsContribution.findOneAndUpdate(
      { _id: id, userId },
      { $set: update },
      { new: true }
    ).lean();

    if (!contribution) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }
    return NextResponse.json({ contribution });
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
    const deleted = await SavingsContribution.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
