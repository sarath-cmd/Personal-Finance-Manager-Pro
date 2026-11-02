"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";

export default function AddGroupModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch("/api/lending/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, note }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    onSaved();
  }

  return (
    <Modal title="Add Group" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-sm text-danger font-semibold mb-3">{error}</p>}
        <p className="text-xs text-text-tertiary mb-4">
          A group bundles several people under one source — e.g. you borrowed on a card and
          lent parts of it to two friends. The group shows as a single card; open it to see
          who owes what.
        </p>
        <div className="mb-4">
          <label className="form-label">Group Name</label>
          <input
            className="form-input"
            placeholder="e.g. HDFC Credit Card Loan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="form-label">Note (optional)</label>
          <input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button className="btn btn-primary w-full justify-center" disabled={saving}>
          {saving ? "Saving…" : "💾 Add Group"}
        </button>
      </form>
    </Modal>
  );
}
