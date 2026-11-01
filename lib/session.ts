import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

/**
 * Single chokepoint for every API route: resolves the authenticated user's
 * id from the verified session cookie/JWT. Never trust a client-supplied
 * userId — every Mongo query in the app must scope by the id returned here.
 */
export async function requireSession(): Promise<{ userId: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }
  return { userId: session.user.id };
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
