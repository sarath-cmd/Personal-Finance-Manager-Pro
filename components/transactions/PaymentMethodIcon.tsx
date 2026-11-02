import { PAYMENT_METHOD_ICONS, type PAYMENT_METHODS } from "@/lib/constants";

export default function PaymentMethodIcon({
  method,
}: {
  method?: string | null;
}) {
  if (!method) return null;
  const icon = PAYMENT_METHOD_ICONS[method as (typeof PAYMENT_METHODS)[number]];
  if (!icon) return null;

  return (
    <span className="ml-1.5 text-xs align-middle" title={method} aria-label={method}>
      {icon}
    </span>
  );
}
