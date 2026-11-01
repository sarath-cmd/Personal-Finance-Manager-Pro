import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isApi = req.nextUrl.pathname.startsWith("/api/");
  if (!req.auth) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/accounts/:path*",
    "/transactions/:path*",
    "/income/:path*",
    "/expenses/:path*",
    "/cashflow/:path*",
    "/lending/:path*",
    "/today/:path*",
    "/calendar/:path*",
    "/snapshot/:path*",
    "/tags/:path*",
    "/budget/:path*",
    "/bills/:path*",
    "/savings/:path*",
    "/debt/:path*",
    "/settings/:path*",
    "/api/accounts/:path*",
    "/api/transactions/:path*",
    "/api/dashboard/:path*",
    "/api/cashflow/:path*",
    "/api/lending/:path*",
    "/api/categories/:path*",
    "/api/tags/:path*",
    "/api/budgets/:path*",
    "/api/bills/:path*",
    "/api/events/:path*",
    "/api/tasks/:path*",
    "/api/savings/:path*",
    "/api/debts/:path*",
    "/api/snapshot/:path*",
    "/api/calendar/:path*",
    "/api/today/:path*",
    "/api/settings/:path*",
  ],
};
