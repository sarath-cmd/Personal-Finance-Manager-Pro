import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { LendingPerson } from "@/models/LendingPerson";
import { LendingEntry } from "@/models/LendingEntry";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { lendingPersonInputSchema } from "@/lib/zodSchemas";

export async function GET() {
  try {
    const { userId } = await requireSession();
    await dbConnect();
    const uid = new Types.ObjectId(userId);

    const people = await LendingPerson.find({ userId }).sort({ createdAt: 1 }).lean();

    const balances = await LendingEntry.aggregate([
      { $match: { userId: uid } },
      {
        $group: {
          _id: "$personId",
          lent: { $sum: { $cond: [{ $eq: ["$type", "lent"] }, "$amount", 0] } },
          returned: { $sum: { $cond: [{ $eq: ["$type", "returned"] }, "$amount", 0] } },
        },
      },
    ]);

    const balanceByPerson = new Map(
      balances.map((b) => [String(b._id), { lent: b.lent, returned: b.returned, balance: b.lent - b.returned }])
    );

    const peopleWithBalance = people.map((p) => ({
      ...p,
      ...(balanceByPerson.get(String(p._id)) ?? { lent: 0, returned: 0, balance: 0 }),
    }));

    return NextResponse.json({ people: peopleWithBalance });
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
    const parsed = lendingPersonInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await dbConnect();
    const person = await LendingPerson.create({ ...parsed.data, userId });
    return NextResponse.json({ person: { ...person.toObject(), lent: 0, returned: 0, balance: 0 } }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
