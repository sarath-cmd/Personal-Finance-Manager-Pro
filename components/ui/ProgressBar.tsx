export default function ProgressBar({
  pct,
  color,
  over,
}: {
  pct: number;
  color?: string;
  over?: boolean;
}) {
  const clamped = Math.max(0, Math.min(pct, 100));
  return (
    <div className="h-2.5 rounded-full bg-light-bg border border-border-color overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${clamped}%`,
          background: over
            ? "linear-gradient(90deg, var(--danger-light), var(--danger))"
            : color ?? "linear-gradient(90deg, var(--primary-light), var(--primary))",
        }}
      />
    </div>
  );
}
