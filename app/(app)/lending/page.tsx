"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import StatTile from "@/components/dashboard/StatTile";
import PersonCard, { type Person } from "@/components/lending/PersonCard";
import AddPersonModal, { type Group } from "@/components/lending/AddPersonModal";
import AddGroupModal from "@/components/lending/AddGroupModal";
import { formatCurrency } from "@/lib/constants";

type GroupWithTotals = Group & { note?: string; memberCount: number; totalPending: number };

export default function LendingPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [groups, setGroups] = useState<GroupWithTotals[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [peopleRes, groupsRes] = await Promise.all([
      fetch("/api/lending/people"),
      fetch("/api/lending/groups"),
    ]);
    const peopleData = await peopleRes.json();
    const groupsData = await groupsRes.json();
    setPeople(peopleData.people ?? []);
    setGroups(groupsData.groups ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  async function handleDeletePerson(id: string) {
    if (!confirm("Delete this person and all their lending history?")) return;
    const res = await fetch(`/api/lending/people/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Could not delete");
      return;
    }
    load();
  }

  const ungroupedPeople = people.filter((p) => !p.groupId);
  const totalOwed =
    people.reduce((s, p) => s + Math.max(p.balance, 0), 0);

  return (
    <div>
      <PageHeader
        icon="🤝"
        title="Lent & Borrowed"
        subtitle="Track money lent to people, what they've returned, and what they still owe."
        action={
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={() => setShowGroupModal(true)}>
              + Add Group
            </button>
            <button className="btn btn-gold" onClick={() => setShowPersonModal(true)}>
              + Add Person
            </button>
          </div>
        }
      />

      <div className="max-w-xs mb-6">
        <StatTile label="Total Owed to You" value={formatCurrency(totalOwed)} tone="gold" icon="💰" />
      </div>

      {loading ? (
        <p className="text-text-tertiary text-sm italic">Loading…</p>
      ) : people.length === 0 && groups.length === 0 ? (
        <div className="card">
          <p className="text-text-tertiary italic text-sm">No one added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
            <Link key={g._id} href={`/lending/group/${g._id}`} className="card mb-0! relative overflow-hidden block hover:border-gold-dark transition-colors">
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: "linear-gradient(90deg, var(--gold-light), var(--gold-dark))" }}
              />
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="icon-chip gold">💳</span>
                  <span className="font-extrabold text-text-primary">{g.name}</span>
                </div>
                <span className="badge badge-gold">{g.memberCount} {g.memberCount === 1 ? "person" : "people"}</span>
              </div>
              <div className="text-xl font-black text-danger mb-1">{formatCurrency(g.totalPending)}</div>
              <div className="text-xs text-text-tertiary mb-4">pending across this group</div>
              <div className="btn btn-secondary w-full justify-center text-xs py-2">View people</div>
            </Link>
          ))}
          {ungroupedPeople.map((p) => (
            <PersonCard key={p._id} person={p} onDelete={handleDeletePerson} />
          ))}
        </div>
      )}

      {showPersonModal && (
        <AddPersonModal
          groups={groups}
          onClose={() => setShowPersonModal(false)}
          onSaved={() => {
            setShowPersonModal(false);
            load();
          }}
        />
      )}

      {showGroupModal && (
        <AddGroupModal
          onClose={() => setShowGroupModal(false)}
          onSaved={() => {
            setShowGroupModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}
