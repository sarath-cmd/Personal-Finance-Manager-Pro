export default function StatTile({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone?: "pos" | "neg" | "gold" | "info";
  icon?: string;
}) {
  const toneClass =
    tone === "pos"
      ? "tone-success"
      : tone === "neg"
      ? "tone-danger"
      : tone === "gold"
      ? "tone-gold"
      : tone === "info"
      ? "tone-info"
      : "";
  const valueToneClass = tone === "pos" ? "pos" : tone === "neg" ? "neg" : "";

  return (
    <div className={`stat-tile ${toneClass}`}>
      {icon && <div className="stat-icon">{icon}</div>}
      <div>
        <div className="stat-tile-label">{label}</div>
        <div className={`stat-tile-value ${valueToneClass}`}>{value}</div>
      </div>
    </div>
  );
}
