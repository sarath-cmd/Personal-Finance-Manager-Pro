import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { loginSchema } from "@/lib/zodSchemas";
import { checkRateLimit } from "@/lib/rateLimit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Password" },
      },
      async authorize(rawCredentials, request) {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const ip =
          request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          "unknown";
        const allowed = await checkRateLimit(`login:${ip}:${email}`);
        if (!allowed) return null;

        await dbConnect();
        const user = await User.findOne({ email }).lean();
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: String(user._id),
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user?.id) token.uid = user.id;
      // Settings page calls useSession().update({ name }) after a profile
      // edit — merge the new name into the token so it shows up immediately
      // without forcing a re-login.
      if (trigger === "update" && session?.name) {
        token.name = session.name as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid && session.user) {
        session.user.id = token.uid as string;
      }
      if (token.name) {
        session.user.name = token.name as string;
      }
      return session;
    },
  },
});
