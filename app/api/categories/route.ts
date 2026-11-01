import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Category } from "@/models/Category";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { categoryInputSchema } from "@/lib/zodSchemas";
import { DEFAULT_CATEGORIES, INCOME_CATEGORIES, TAG_KINDS } from "@/lib/constants";

async function ensureSeeded(userId: string) {
  const count = await Category.countDocuments({ userId });
  if (count > 0) return;

  const docs = [
    ...DEFAULT_CATEGORIES.map((name) => ({ userId, kind: "expense", name })),
    ...INCOME_CATEGORIES.map((name) => ({ userId, kind: "income", name })),
  ];
  await Category.insertMany(docs, { ordered: false }).catch(() => null);
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireSession();
    const url = new URL(req.url);
    const kindParam = url.searchParams.get("kind");
    const kind = TAG_KINDS.includes(kindParam as (typeof TAG_KINDS)[number])
      ? (kindParam as (typeof TAG_KINDS)[number])
      : undefined;

    await dbConnect();
    await ensureSeeded(userId);

    const filter: Record<string, unknown> = { userId };
    if (kind) filter.kind = kind;

    const categories = await Category.find(filter).sort({ name: 1 }).lean();
    return NextResponse.json({ categories });
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
    const parsed = categoryInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await dbConnect();
    const existing = await Category.findOne({ userId, ...parsed.data }).lean();
    if (existing) {
      return NextResponse.json({ error: "That category already exists." }, { status: 409 });
    }

    const category = await Category.create({ ...parsed.data, userId });
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
