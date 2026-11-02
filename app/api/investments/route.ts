import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { InvestmentEntry } from "@/models/InvestmentEntry";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { investmentEntryInputSchema, investmentEntryQuerySchema } from "@/lib/zodSchemas";
import { getActiveMonth, monthToUtcRange } from "@/lib/month";
import { INVESTMENT_KINDS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireSession();
    const url = new URL(req.url);
    const parsedQuery = investmentEntryQuerySchema.safeParse({
      kind: url.searchParams.get("kind") ?? undefined,
      month: url.searchParams.get("month"),
    });
    if (!parsedQuery.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }
    const month = getActiveMonth(parsedQuery.data.month);
    const { start, end } = monthToUtcRange(month);

    await dbConnect();
    const uid = new Types.ObjectId(userId);

    const filter: Record<string, unknown> = { userId, date: { $gte: start, $lt: end } };
    if (parsedQuery.data.kind) filter.kind = parsedQuery.data.kind;

    const [entries, totalsByKind] = await Promise.all([
      InvestmentEntry.find(filter).sort({ date: -1, createdAt: -1 }).lean(),
      InvestmentEntry.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: "$kind", total: { $sum: "$amount" } } },
      ]),
    ]);

    const totalInvested: Record<string, number> = Object.fromEntries(INVESTMENT_KINDS.map((k) => [k, 0]));
    for (const row of totalsByKind) totalInvested[row._id] = row.total;

    return NextResponse.json({ month, entries, totalInvested });
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
    const parsed = investmentEntryInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await dbConnect();
    const entry = await InvestmentEntry.create({
      ...parsed.data,
      userId,
      date: new Date(`${parsed.data.date}T00:00:00.000Z`),
      quantity: parsed.data.quantity ?? null,
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
