import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Tag } from "@/models/Tag";
import { requireSession, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { tagInputSchema } from "@/lib/zodSchemas";
import { TAG_KINDS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireSession();
    const url = new URL(req.url);
    const kindParam = url.searchParams.get("kind");
    const kind = TAG_KINDS.includes(kindParam as (typeof TAG_KINDS)[number])
      ? (kindParam as (typeof TAG_KINDS)[number])
      : undefined;

    await dbConnect();
    const filter: Record<string, unknown> = { userId };
    if (kind) filter.kind = kind;

    const tags = await Tag.find(filter).sort({ name: 1 }).lean();
    return NextResponse.json({ tags });
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
    const parsed = tagInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await dbConnect();
    const existing = await Tag.findOne({
      userId,
      kind: parsed.data.kind,
      name: parsed.data.name,
    }).lean();
    if (existing) {
      return NextResponse.json({ tag: existing }, { status: 200 });
    }

    const tag = await Tag.create({ ...parsed.data, userId });
    return NextResponse.json({ tag }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
