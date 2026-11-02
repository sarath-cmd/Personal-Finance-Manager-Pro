import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { Account } from "@/models/Account";
import { Transaction } from "@/models/Transaction";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { transactionInputSchema, transactionQuerySchema } from "@/lib/zodSchemas";
import { getActiveMonth, monthToUtcRange } from "@/lib/month";
import { txDelta } from "@/lib/balance";
import { ensureTagsExist } from "@/lib/tags";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireSession();
    const url = new URL(req.url);

    const parsedQuery = transactionQuerySchema.safeParse({
      month: url.searchParams.get("month"),
      type: url.searchParams.get("type") ?? undefined,
      category: url.searchParams.get("category") ?? undefined,
    });
    if (!parsedQuery.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    const month = getActiveMonth(parsedQuery.data.month);
    const { start, end } = monthToUtcRange(month);

    const filter: Record<string, unknown> = {
      userId,
      date: { $gte: start, $lt: end },
    };
    if (parsedQuery.data.type !== "all") filter.type = parsedQuery.data.type;
    if (parsedQuery.data.category) filter.category = parsedQuery.data.category;

    await dbConnect();
    const transactions = await Transaction.find(filter).sort({ date: -1, createdAt: -1 }).lean();

    return NextResponse.json({ month, transactions });
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
    const parsed = transactionInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const input = parsed.data;

    await dbConnect();

    if (input.tags?.length) {
      await ensureTagsExist(userId, input.type, input.tags);
    }

    const mongoSession = await mongoose.startSession();

    try {
      let createdId: string | null = null;

      await mongoSession.withTransaction(async () => {
        let appliedDelta = 0;
        let appliedAccountId: string | null = null;

        if (input.accountId) {
          const account = await Account.findOne(
            { _id: input.accountId, userId },
            null,
            { session: mongoSession }
          );
          if (!account) throw new Error("ACCOUNT_NOT_FOUND");

          const delta = txDelta(
            { type: input.type, amount: input.amount, status: input.status },
            account
          );
          if (delta) {
            await Account.updateOne(
              { _id: account._id },
              { $inc: { balance: delta } },
              { session: mongoSession }
            );
          }
          appliedDelta = delta;
          appliedAccountId = String(account._id);
        }

        const [doc] = await Transaction.create(
          [
            {
              userId,
              type: input.type,
              date: new Date(`${input.date}T00:00:00.000Z`),
              description: input.description,
              amount: input.amount,
              category: input.category,
              accountId: input.accountId ?? null,
              tags: input.tags ?? [],
              paymentMethod: input.paymentMethod ?? undefined,
              status: input.type === "income" ? input.status ?? "Received" : undefined,
              classification: input.type === "expense" ? input.classification ?? "Unclassified" : undefined,
              appliedDelta,
              appliedAccountId,
            },
          ],
          { session: mongoSession }
        );
        createdId = String(doc._id);
      });

      const transaction = await Transaction.findById(createdId).lean();
      return NextResponse.json({ transaction }, { status: 201 });
    } catch (err) {
      if (err instanceof Error && err.message === "ACCOUNT_NOT_FOUND") {
        return NextResponse.json({ error: "Account not found" }, { status: 400 });
      }
      throw err;
    } finally {
      await mongoSession.endSession();
    }
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
