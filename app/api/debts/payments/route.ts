import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Debt } from "@/models/Debt";
import { DebtPayment } from "@/models/DebtPayment";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { debtPaymentInputSchema, debtPaymentQuerySchema } from "@/lib/zodSchemas";
import { getActiveMonth, monthToUtcRange } from "@/lib/month";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireSession();
    const url = new URL(req.url);
    const parsedQuery = debtPaymentQuerySchema.safeParse({
      debtId: url.searchParams.get("debtId") ?? undefined,
      month: url.searchParams.get("month"),
    });
    if (!parsedQuery.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    await dbConnect();

    const filter: Record<string, unknown> = { userId };
    if (parsedQuery.data.debtId) filter.debtId = parsedQuery.data.debtId;

    if (url.searchParams.has("month") || !parsedQuery.data.debtId) {
      const month = getActiveMonth(parsedQuery.data.month);
      const { start, end } = monthToUtcRange(month);
      filter.date = { $gte: start, $lt: end };
    }

    const payments = await DebtPayment.find(filter).sort({ date: -1, createdAt: -1 }).lean();
    return NextResponse.json({ payments });
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
    const parsed = debtPaymentInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const input = parsed.data;

    await dbConnect();
    const debt = await Debt.findOne({ _id: input.debtId, userId }).lean();
    if (!debt) {
      return NextResponse.json({ error: "Debt not found" }, { status: 400 });
    }

    const payment = await DebtPayment.create({
      userId,
      debtId: input.debtId,
      date: new Date(`${input.date}T00:00:00.000Z`),
      amount: input.amount,
      note: input.note ?? "",
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
