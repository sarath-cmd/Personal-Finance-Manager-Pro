import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Account } from "@/models/Account";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { accountInputSchema } from "@/lib/zodSchemas";

export async function GET() {
  try {
    const { userId } = await requireSession();
    await dbConnect();
    const accounts = await Account.find({ userId }).sort({ createdAt: 1 }).lean();
    return NextResponse.json({ accounts });
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
    const parsed = accountInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await dbConnect();
    const account = await Account.create({ ...parsed.data, userId });
    return NextResponse.json({ account }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
