"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";

export type Group = { _id: string; name: string };

export default function AddPersonModal({
  groups,
  defaultGroupId,
  onClose,
  onSaved,
}: {
  groups: Group[];
  defaultGroupId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [groupId, setGroupId] = useState(defaultGroupId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch("/api/lending/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, note, groupId: groupId || null }),
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
    <Modal title="Add Person" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-sm text-danger font-semibold mb-3">{error}</p>}
        <div className="mb-4">
          <label className="form-label">Name</label>
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        {groups.length > 0 && (
          <div className="mb-4">
            <label className="form-label">Group (optional)</label>
            <select className="form-select" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">No group</option>
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-tertiary mt-1.5">
              Use a group when you lent out money from one source (e.g. a card loan) to several people.
            </p>
          </div>
        )}
        <div className="mb-4">
          <label className="form-label">Note (optional)</label>
          <input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button className="btn btn-primary w-full justify-center" disabled={saving}>
          {saving ? "Saving…" : "💾 Add Person"}
        </button>
      </form>
    </Modal>
  );
}
