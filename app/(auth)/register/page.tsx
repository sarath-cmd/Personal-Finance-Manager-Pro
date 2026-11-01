"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/ui/PasswordInput";

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs ${met ? "text-success" : "text-text-tertiary"}`}>
      <span>{met ? "✓" : "○"}</span>
      {label}
    </li>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);

  const hasLength = password.length >= 10;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordValid = hasLength && hasLetter && hasNumber;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!passwordValid) {
      setTouchedPassword(true);
      setError("Please meet all password requirements.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json().catch(() => ({ error: "Something went wrong. Please try again." }));

    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Something went wrong.");
      return;
    }

    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (signInRes?.error) {
      router.push("/login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-extrabold text-text-primary">Create your account</h2>
      <p className="text-text-secondary text-sm mt-1 mb-6">
        Takes less than a minute — no bank details required.
      </p>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-danger/10 border border-danger/20 px-3 py-2.5">
          <span className="text-danger text-sm">⚠️</span>
          <p className="text-sm text-danger font-medium">{error}</p>
        </div>
      )}

      <div className="mb-4">
        <label className="form-label">Name</label>
        <input
          type="text"
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          placeholder="Jane Doe"
        />
      </div>
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
      <div className="mb-3">
        <label className="form-label">Password</label>
        <PasswordInput
          value={password}
          onChange={(v) => {
            setPassword(v);
            setTouchedPassword(true);
          }}
          autoComplete="new-password"
        />
      </div>

      {(touchedPassword || password.length > 0) && (
        <ul className="mb-4 flex flex-col gap-1">
          <PasswordRule met={hasLength} label="At least 10 characters" />
          <PasswordRule met={hasLetter} label="Contains a letter" />
          <PasswordRule met={hasNumber} label="Contains a number" />
        </ul>
      )}

      <div className="mb-6">
        <label className="form-label">Confirm password</label>
        <PasswordInput value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
        {confirmPassword.length > 0 && !passwordsMatch && (
          <p className="text-xs text-danger mt-1.5">Passwords don&apos;t match</p>
        )}
      </div>

      <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
        {loading ? (
          <>
            <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </button>
      <p className="mt-6 text-sm text-text-secondary text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
