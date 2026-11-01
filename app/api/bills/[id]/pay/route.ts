import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { Bill } from "@/models/Bill";
import { Account } from "@/models/Account";
import { Transaction } from "@/models/Transaction";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { billPaySchema, objectId } from "@/lib/zodSchemas";
import { txDelta } from "@/lib/balance";
import { monthToUtcRange } from "@/lib/month";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireSession();
    const { id } = await params;
    if (!objectId.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = billPaySchema.safeParse(
      Object.keys(body).length ? body : { date: new Date().toISOString().slice(0, 10) }
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await dbConnect();
    const bill = await Bill.findOne({ _id: id, userId });
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const { start, end } = monthToUtcRange(parsed.data.date.slice(0, 7));
    const alreadyPaid = await Transaction.exists({
      userId,
      billId: bill._id,
      date: { $gte: start, $lt: end },
    });
    if (alreadyPaid) {
      return NextResponse.json({ error: "This bill is already marked paid for that month." }, { status: 409 });
    }

    const mongoSession = await mongoose.startSession();
    try {
      let createdId: string | null = null;

      await mongoSession.withTransaction(async () => {
        let appliedDelta = 0;
        let appliedAccountId: string | null = null;

        if (bill.accountId) {
          const account = await Account.findOne({ _id: bill.accountId, userId }, null, {
            session: mongoSession,
          });
          if (account) {
            const delta = txDelta({ type: "expense", amount: bill.amount }, account);
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
        }

        const [doc] = await Transaction.create(
          [
            {
              userId,
              type: "expense",
              date: new Date(`${parsed.data.date}T00:00:00.000Z`),
              description: bill.name,
              amount: bill.amount,
              category: bill.category,
              accountId: bill.accountId ?? null,
              billId: bill._id,
              classification: "Unclassified",
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
    } finally {
      await mongoSession.endSession();
    }
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
