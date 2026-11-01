import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { LendingPerson } from "@/models/LendingPerson";
import { LendingEntry } from "@/models/LendingEntry";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { lendingEntryInputSchema, lendingEntryQuerySchema } from "@/lib/zodSchemas";
import { getActiveMonth, monthToUtcRange } from "@/lib/month";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireSession();
    const url = new URL(req.url);
    const parsedQuery = lendingEntryQuerySchema.safeParse({
      personId: url.searchParams.get("personId") ?? undefined,
      month: url.searchParams.get("month"),
    });
    if (!parsedQuery.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    await dbConnect();

    const filter: Record<string, unknown> = { userId };
    if (parsedQuery.data.personId) filter.personId = parsedQuery.data.personId;

    if (url.searchParams.has("month") || !parsedQuery.data.personId) {
      const month = getActiveMonth(parsedQuery.data.month);
      const { start, end } = monthToUtcRange(month);
      filter.date = { $gte: start, $lt: end };
    }

    const entries = await LendingEntry.find(filter).sort({ date: -1, createdAt: -1 }).lean();
    return NextResponse.json({ entries });
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
    const parsed = lendingEntryInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const input = parsed.data;

    await dbConnect();

    const person = await LendingPerson.findOne({ _id: input.personId, userId }).lean();
    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 400 });
    }

    const entry = await LendingEntry.create({
      userId,
      personId: input.personId,
      date: new Date(`${input.date}T00:00:00.000Z`),
      type: input.type,
      amount: input.amount,
      note: input.note ?? "",
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
