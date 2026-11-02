"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import StatTile from "@/components/dashboard/StatTile";
import PersonCard, { type Person } from "@/components/lending/PersonCard";
import AddPersonModal, { type Group } from "@/components/lending/AddPersonModal";
import { SkeletonCardGrid, SkeletonPageHeader, SkeletonStatTile } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/constants";

type GroupWithTotals = Group & { note?: string; memberCount: number; totalPending: number };

export default function LendingGroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();

  const [group, setGroup] = useState<GroupWithTotals | null>(null);
  const [members, setMembers] = useState<Person[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPersonModal, setShowPersonModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [peopleRes, groupsRes] = await Promise.all([
      fetch("/api/lending/people"),
      fetch("/api/lending/groups"),
    ]);
    const peopleData = await peopleRes.json();
    const groupsData = await groupsRes.json();

    const groups: GroupWithTotals[] = groupsData.groups ?? [];
    const thisGroup = groups.find((g) => g._id === groupId) ?? null;
    setGroup(thisGroup);
    setAllGroups(groups);
    setMembers((peopleData.people ?? []).filter((p: Person) => p.groupId === groupId));
    setLoading(false);
  }, [groupId]);

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

  async function handleDeleteGroup() {
    if (!confirm("Delete this group? People in it will stay, just ungrouped.")) return;
    const res = await fetch(`/api/lending/groups/${groupId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Could not delete group");
      return;
    }
    router.push("/lending");
  }

  return (
    <div>
      <Link href="/lending" className="text-sm text-primary font-semibold">
        ‹ Back to Lent &amp; Borrowed
      </Link>

      {loading || !group ? (
        <div className="mt-4">
          <SkeletonPageHeader />
          <div className="max-w-xs mb-6">
            <SkeletonStatTile />
          </div>
          <SkeletonCardGrid count={3} />
        </div>
      ) : (
        <>
          <div className="mt-4">
            <PageHeader
              icon="💳"
              title={group.name}
              subtitle={`${group.memberCount} ${group.memberCount === 1 ? "person" : "people"} owing from this source.`}
              action={
                <div className="flex gap-2">
                  <button className="btn btn-secondary text-xs py-2 px-4" onClick={handleDeleteGroup}>
                    🗑️ Delete Group
                  </button>
                  <button className="btn btn-gold" onClick={() => setShowPersonModal(true)}>
                    + Add Person
                  </button>
                </div>
              }
            />
          </div>

          <div className="max-w-xs mb-6">
            <StatTile label="Total Pending" value={formatCurrency(group.totalPending)} tone="neg" icon="💰" />
          </div>

          {members.length === 0 ? (
            <div className="card">
              <p className="text-text-tertiary italic text-sm">No one in this group yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((p) => (
                <PersonCard key={p._id} person={p} onDelete={handleDeletePerson} />
              ))}
            </div>
          )}
        </>
      )}

      {showPersonModal && (
        <AddPersonModal
          groups={allGroups}
          defaultGroupId={groupId}
          onClose={() => setShowPersonModal(false)}
          onSaved={() => {
            setShowPersonModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}
