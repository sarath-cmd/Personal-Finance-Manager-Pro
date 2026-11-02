import { Tag } from "@/models/Tag";
import { colorForTagName, type TAG_KINDS } from "@/lib/constants";

/**
 * Any tag name on a transaction that doesn't already exist in the user's
 * tag palette gets created automatically (with a deterministic fallback
 * color), so tags typed directly into a transaction always show up
 * consistently colored on the Tags page and in filters.
 */
export async function ensureTagsExist(
  userId: string,
  kind: (typeof TAG_KINDS)[number],
  names: string[]
): Promise<void> {
  const uniqueNames = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
  if (uniqueNames.length === 0) return;

  const existing = await Tag.find({ userId, kind, name: { $in: uniqueNames } })
    .select("name")
    .lean();
  const existingNames = new Set(existing.map((t) => t.name.toLowerCase()));
  const missing = uniqueNames.filter((n) => !existingNames.has(n.toLowerCase()));
  if (missing.length === 0) return;

  await Tag.insertMany(
    missing.map((name) => ({ userId, kind, name, color: colorForTagName(name) })),
    { ordered: false }
  ).catch(() => null); // a duplicate-key race just means another request created it first
}
