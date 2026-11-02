import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { Account } from "@/models/Account";
import { Transfer } from "@/models/Transfer";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { transferPatchSchema, objectId } from "@/lib/zodSchemas";
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
    const parsed = transferPatchSchema.safeParse(body);
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
      let sameAccount = false;

      await mongoSession.withTransaction(async () => {
        const existing = await Transfer.findOne({ _id: id, userId }, null, { session: mongoSession });
        if (!existing) {
          notFound = true;
          return;
        }

        // Revert the previously applied balance effect on both accounts.
        // A single ClientSession can only have one operation in flight at a
        // time, so these must run sequentially, not via Promise.all.
        await Account.updateOne(
          { _id: existing.fromAccountId },
          { $inc: { balance: -existing.appliedFromDelta } },
          { session: mongoSession }
        );
        await Account.updateOne(
          { _id: existing.toAccountId },
          { $inc: { balance: -existing.appliedToDelta } },
          { session: mongoSession }
        );

        const merged = {
          date: patch.date ? new Date(`${patch.date}T00:00:00.000Z`) : existing.date,
          fromAccountId: patch.fromAccountId ?? String(existing.fromAccountId),
          toAccountId: patch.toAccountId ?? String(existing.toAccountId),
          amount: patch.amount ?? existing.amount,
          note: patch.note ?? existing.note,
        };

        if (merged.fromAccountId === merged.toAccountId) {
          sameAccount = true;
          return;
        }

        const fromAccount = await Account.findOne({ _id: merged.fromAccountId, userId }, null, {
          session: mongoSession,
        });
        const toAccount = await Account.findOne({ _id: merged.toAccountId, userId }, null, {
          session: mongoSession,
        });
        if (!fromAccount || !toAccount) {
          accountNotFound = true;
          return;
        }

        const fromDelta = txDelta({ type: "expense", amount: merged.amount }, fromAccount);
        const toDelta = txDelta({ type: "income", amount: merged.amount, status: "Received" }, toAccount);

        await Account.updateOne({ _id: fromAccount._id }, { $inc: { balance: fromDelta } }, { session: mongoSession });
        await Account.updateOne({ _id: toAccount._id }, { $inc: { balance: toDelta } }, { session: mongoSession });

        existing.set({
          date: merged.date,
          fromAccountId: fromAccount._id,
          toAccountId: toAccount._id,
          amount: merged.amount,
          note: merged.note,
          appliedFromDelta: fromDelta,
          appliedToDelta: toDelta,
        });
        await existing.save({ session: mongoSession });
      });

      if (notFound) {
        return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
      }
      if (sameAccount) {
        return NextResponse.json({ error: "Choose two different accounts" }, { status: 400 });
      }
      if (accountNotFound) {
        return NextResponse.json({ error: "Account not found" }, { status: 400 });
      }

      const transfer = await Transfer.findById(id).lean();
      return NextResponse.json({ transfer });
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
        const existing = await Transfer.findOne({ _id: id, userId }, null, { session: mongoSession });
        if (!existing) {
          notFound = true;
          return;
        }

        await Account.updateOne(
          { _id: existing.fromAccountId },
          { $inc: { balance: -existing.appliedFromDelta } },
          { session: mongoSession }
        );
        await Account.updateOne(
          { _id: existing.toAccountId },
          { $inc: { balance: -existing.appliedToDelta } },
          { session: mongoSession }
        );

        await Transfer.deleteOne({ _id: id }, { session: mongoSession });
      });

      if (notFound) {
        return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
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
