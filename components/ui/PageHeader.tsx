export default function PageHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
      <div className="flex items-start gap-4">
        <div className="page-icon">{icon}</div>
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary mb-1">{title}</h1>
          <p className="text-text-secondary text-sm">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
