import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { LendingGroup } from "@/models/LendingGroup";
import { LendingPerson } from "@/models/LendingPerson";
import { LendingEntry } from "@/models/LendingEntry";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { lendingGroupInputSchema } from "@/lib/zodSchemas";

export async function GET() {
  try {
    const { userId } = await requireSession();
    await dbConnect();
    const uid = new Types.ObjectId(userId);

    const [groups, people, balances] = await Promise.all([
      LendingGroup.find({ userId }).sort({ createdAt: 1 }).lean(),
      LendingPerson.find({ userId, groupId: { $ne: null } }).lean(),
      LendingEntry.aggregate([
        { $match: { userId: uid } },
        {
          $group: {
            _id: "$personId",
            lent: { $sum: { $cond: [{ $eq: ["$type", "lent"] }, "$amount", 0] } },
            returned: { $sum: { $cond: [{ $eq: ["$type", "returned"] }, "$amount", 0] } },
          },
        },
      ]),
    ]);

    const balanceByPerson = new Map(balances.map((b) => [String(b._id), b.lent - b.returned]));

    const groupsWithTotals = groups.map((g) => {
      const members = people.filter((p) => String(p.groupId) === String(g._id));
      const totalPending = members.reduce((sum, p) => sum + Math.max(balanceByPerson.get(String(p._id)) ?? 0, 0), 0);
      return { ...g, memberCount: members.length, totalPending };
    });

    return NextResponse.json({ groups: groupsWithTotals });
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
    const parsed = lendingGroupInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await dbConnect();
    const group = await LendingGroup.create({ ...parsed.data, userId });
    return NextResponse.json(
      { group: { ...group.toObject(), memberCount: 0, totalPending: 0 } },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
