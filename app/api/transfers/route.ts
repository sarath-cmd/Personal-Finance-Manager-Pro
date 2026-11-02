import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { Account } from "@/models/Account";
import { Transfer } from "@/models/Transfer";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { transferInputSchema, transferQuerySchema } from "@/lib/zodSchemas";
import { getActiveMonth, monthToUtcRange } from "@/lib/month";
import { txDelta } from "@/lib/balance";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireSession();
    const url = new URL(req.url);
    const parsedQuery = transferQuerySchema.safeParse({ month: url.searchParams.get("month") });
    if (!parsedQuery.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }
    const month = getActiveMonth(parsedQuery.data.month);
    const { start, end } = monthToUtcRange(month);

    await dbConnect();
    const transfers = await Transfer.find({ userId, date: { $gte: start, $lt: end } })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ month, transfers });
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
    const parsed = transferInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const input = parsed.data;

    await dbConnect();
    const mongoSession = await mongoose.startSession();

    try {
      let createdId: string | null = null;
      let accountNotFound = false;

      await mongoSession.withTransaction(async () => {
        const [fromAccount, toAccount] = await Promise.all([
          Account.findOne({ _id: input.fromAccountId, userId }, null, { session: mongoSession }),
          Account.findOne({ _id: input.toAccountId, userId }, null, { session: mongoSession }),
        ]);
        if (!fromAccount || !toAccount) {
          accountNotFound = true;
          return;
        }

        const fromDelta = txDelta({ type: "expense", amount: input.amount }, fromAccount);
        const toDelta = txDelta({ type: "income", amount: input.amount, status: "Received" }, toAccount);

        await Promise.all([
          Account.updateOne({ _id: fromAccount._id }, { $inc: { balance: fromDelta } }, { session: mongoSession }),
          Account.updateOne({ _id: toAccount._id }, { $inc: { balance: toDelta } }, { session: mongoSession }),
        ]);

        const [doc] = await Transfer.create(
          [
            {
              userId,
              date: new Date(`${input.date}T00:00:00.000Z`),
              fromAccountId: fromAccount._id,
              toAccountId: toAccount._id,
              amount: input.amount,
              note: input.note,
              appliedFromDelta: fromDelta,
              appliedToDelta: toDelta,
            },
          ],
          { session: mongoSession }
        );
        createdId = String(doc._id);
      });

      if (accountNotFound) {
        return NextResponse.json({ error: "Account not found" }, { status: 400 });
      }

      const transfer = await Transfer.findById(createdId).lean();
      return NextResponse.json({ transfer }, { status: 201 });
    } finally {
      await mongoSession.endSession();
    }
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
