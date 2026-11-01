"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import PasswordInput from "@/components/ui/PasswordInput";

function ProfileForm() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    await update({ name });
    setSaved(true);
  }

  return (
    <div className="card">
      <h2 className="font-extrabold text-text-primary mb-5 flex items-center gap-2">
        <span className="icon-chip">👤</span>
        Profile
      </h2>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-sm text-danger font-semibold mb-3">{error}</p>}
        {saved && <p className="text-sm text-success font-semibold mb-3">Saved.</p>}
        <div className="mb-4">
          <label className="form-label">Name</label>
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label className="form-label">Email</label>
          <input className="form-input opacity-60" value={session?.user?.email ?? ""} disabled />
        </div>
        <button className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "💾 Save Profile"}
        </button>
      </form>
    </div>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasLength = newPassword.length >= 10;
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!(hasLength && hasLetter && hasNumber)) {
      setError("Please meet all password requirements.");
      return;
    }
    if (!passwordsMatch) {
      setError("New passwords don't match.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/settings/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSaved(true);
  }

  return (
    <div className="card">
      <h2 className="font-extrabold text-text-primary mb-5 flex items-center gap-2">
        <span className="icon-chip gold">🔒</span>
        Change Password
      </h2>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-sm text-danger font-semibold mb-3">{error}</p>}
        {saved && <p className="text-sm text-success font-semibold mb-3">Password updated.</p>}
        <div className="mb-4">
          <label className="form-label">Current Password</label>
          <PasswordInput value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" required />
        </div>
        <div className="mb-4">
          <label className="form-label">New Password</label>
          <PasswordInput value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
        </div>
        {newPassword.length > 0 && (
          <ul className="mb-4 flex flex-col gap-1">
            <li className={`text-xs ${hasLength ? "text-success" : "text-text-tertiary"}`}>{hasLength ? "✓" : "○"} At least 10 characters</li>
            <li className={`text-xs ${hasLetter ? "text-success" : "text-text-tertiary"}`}>{hasLetter ? "✓" : "○"} Contains a letter</li>
            <li className={`text-xs ${hasNumber ? "text-success" : "text-text-tertiary"}`}>{hasNumber ? "✓" : "○"} Contains a number</li>
          </ul>
        )}
        <div className="mb-5">
          <label className="form-label">Confirm New Password</label>
          <PasswordInput value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-xs text-danger mt-1.5">Passwords don&apos;t match</p>
          )}
        </div>
        <button className="btn btn-primary" disabled={saving}>
          {saving ? "Updating…" : "🔒 Update Password"}
        </button>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div>
      <PageHeader icon="⚙️" title="Settings" subtitle="Manage your profile, password, and data preferences." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <ProfileForm />
        <PasswordForm />
      </div>

      <div className="card">
        <h2 className="font-extrabold text-text-primary mb-5 flex items-center gap-2">
          <span className="icon-chip">🏷️</span>
          Data
        </h2>
        <div className="flex gap-3 flex-wrap">
          <Link href="/tags" className="btn btn-secondary text-xs py-2 px-4">
            Manage Tags
          </Link>
          <Link href="/budget/categories" className="btn btn-secondary text-xs py-2 px-4">
            Manage Categories
          </Link>
        </div>
      </div>
    </div>
  );
}
