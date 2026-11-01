import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { Account } from "@/models/Account";
import { Transaction } from "@/models/Transaction";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { transactionPatchSchema, objectId } from "@/lib/zodSchemas";
import { txDelta } from "@/lib/balance";

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
    const parsed = transactionPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const patch = parsed.data;

    await dbConnect();
    const mongoSession = await mongoose.startSession();

    try {
      let notFound = false;
      let accountNotFound = false;

      await mongoSession.withTransaction(async () => {
        const existing = await Transaction.findOne({ _id: id, userId }, null, {
          session: mongoSession,
        });
        if (!existing) {
          notFound = true;
          return;
        }

        // Revert the previously applied balance effect, if any.
        if (existing.appliedAccountId && existing.appliedDelta) {
          await Account.updateOne(
            { _id: existing.appliedAccountId },
            { $inc: { balance: -existing.appliedDelta } },
            { session: mongoSession }
          );
        }

        const merged = {
          type: patch.type ?? existing.type,
          date: patch.date ? new Date(`${patch.date}T00:00:00.000Z`) : existing.date,
          description: patch.description ?? existing.description,
          amount: patch.amount ?? existing.amount,
          category: patch.category ?? existing.category,
          accountId:
            patch.accountId !== undefined ? patch.accountId : existing.accountId,
          tags: patch.tags ?? existing.tags,
          status: patch.status ?? existing.status,
          classification: patch.classification ?? existing.classification,
        };

        let appliedDelta = 0;
        let appliedAccountId: string | null = null;

        if (merged.accountId) {
          const account = await Account.findOne(
            { _id: merged.accountId, userId },
            null,
            { session: mongoSession }
          );
          if (!account) {
            accountNotFound = true;
            return;
          }

          const delta = txDelta(
            { type: merged.type, amount: merged.amount, status: merged.status },
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

        existing.set({
          ...merged,
          status: merged.type === "income" ? merged.status ?? "Received" : undefined,
          classification:
            merged.type === "expense" ? merged.classification ?? "Unclassified" : undefined,
          appliedDelta,
          appliedAccountId,
        });
        await existing.save({ session: mongoSession });
      });

      if (notFound) {
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      }
      if (accountNotFound) {
        return NextResponse.json({ error: "Account not found" }, { status: 400 });
      }

      const transaction = await Transaction.findById(id).lean();
      return NextResponse.json({ transaction });
    } finally {
      await mongoSession.endSession();
    }
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
    const mongoSession = await mongoose.startSession();

    try {
      let notFound = false;

      await mongoSession.withTransaction(async () => {
        const existing = await Transaction.findOne({ _id: id, userId }, null, {
          session: mongoSession,
        });
        if (!existing) {
          notFound = true;
          return;
        }

        if (existing.appliedAccountId && existing.appliedDelta) {
          await Account.updateOne(
            { _id: existing.appliedAccountId },
            { $inc: { balance: -existing.appliedDelta } },
            { session: mongoSession }
          );
        }

        await Transaction.deleteOne({ _id: id }, { session: mongoSession });
      });

      if (notFound) {
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    } finally {
      await mongoSession.endSession();
    }
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
