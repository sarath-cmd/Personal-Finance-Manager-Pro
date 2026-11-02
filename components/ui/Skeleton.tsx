import type { CSSProperties } from "react";

export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function SkeletonText({
  width = "100%",
  height = "0.9rem",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return <div className={`skeleton ${className}`} style={{ width, height }} />;
}

export function SkeletonCircle({ size = "2.5rem" }: { size?: string }) {
  return <div className="skeleton rounded-full flex-shrink-0" style={{ width: size, height: size }} />;
}

export function SkeletonStatTile() {
  return (
    <div className="stat-tile">
      <SkeletonText width="60%" height="0.75rem" className="mb-3" />
      <SkeletonText width="45%" height="1.5rem" />
    </div>
  );
}

export function SkeletonStatRow({ count = 4, cols = 4 }: { count?: number; cols?: number }) {
  const colsClass =
    cols === 3 ? "lg:grid-cols-3" : cols === 2 ? "lg:grid-cols-2" : "lg:grid-cols-4";
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${colsClass} gap-4 mb-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatTile key={i} />
      ))}
    </div>
  );
}

export function SkeletonTableRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c}>
              <SkeletonText width={c === 0 ? "80%" : "55%"} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card">
      <SkeletonText width="35%" height="1.1rem" className="mb-5" />
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}>
                <SkeletonText width="70%" height="0.75rem" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}>
                  <SkeletonText width={c === 0 ? "80%" : "55%"} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <SkeletonCircle />
        <div className="flex-1">
          <SkeletonText width="50%" height="1rem" className="mb-2" />
          <SkeletonText width="30%" height="0.75rem" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonText key={i} width={`${85 - i * 12}%`} className="mb-2" />
      ))}
    </div>
  );
}

export function SkeletonCardGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonPageHeader() {
  return (
    <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
      <div className="flex items-center gap-3">
        <SkeletonCircle size="3rem" />
        <div>
          <SkeletonText width="12rem" height="1.4rem" className="mb-2" />
          <SkeletonText width="18rem" height="0.85rem" />
        </div>
      </div>
      <SkeletonText width="7rem" height="2.5rem" className="rounded-lg" />
    </div>
  );
}

export function SkeletonCalendar() {
  return (
    <div className="card">
      <SkeletonText width="30%" height="1.1rem" className="mb-5" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="card">
      <SkeletonText width="35%" height="1.1rem" className="mb-5" />
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="mb-4">
          <SkeletonText width="30%" height="0.75rem" className="mb-2" />
          <SkeletonText width="100%" height="2.5rem" className="rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div>
      <SkeletonPageHeader />
      <SkeletonStatRow count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SkeletonTable rows={5} cols={3} />
        <SkeletonTable rows={5} cols={3} />
      </div>
    </div>
  );
}
