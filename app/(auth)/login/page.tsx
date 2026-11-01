"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/ui/PasswordInput";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("That email and password don't match any account.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-extrabold text-text-primary">Welcome back</h2>
      <p className="text-text-secondary text-sm mt-1 mb-6">
        Sign in to see your dashboard.
      </p>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-danger/10 border border-danger/20 px-3 py-2.5">
          <span className="text-danger text-sm">⚠️</span>
          <p className="text-sm text-danger font-medium">{error}</p>
        </div>
      )}

      <div className="mb-4">
        <label className="form-label">Email</label>
        <input
          type="email"
          className="form-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
      </div>
      <div className="mb-6">
        <label className="form-label">Password</label>
        <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" required />
      </div>
      <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
        {loading ? (
          <>
            <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </button>
      <p className="mt-6 text-sm text-text-secondary text-center">
        No account?{" "}
        <Link href="/register" className="text-primary font-semibold hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
