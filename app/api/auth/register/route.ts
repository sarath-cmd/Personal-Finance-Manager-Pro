import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { registerSchema } from "@/lib/zodSchemas";
import { checkRateLimit } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const allowed = await checkRateLimit(`register:${ip}`);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again in a minute." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    await dbConnect();

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ name, email, passwordHash });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Could not reach the database. Check MONGODB_URI in .env.local." },
      { status: 500 }
    );
  }
}
