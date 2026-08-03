import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Conta o tempo que falta para a promoção acabar */
export const SaleCountdown = ({
  endsAt,
  className,
  prefix = "Oferta termina em",
}: {
  endsAt?: string | null;
  className?: string;
  prefix?: string;
}) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!endsAt) return null;
  const diff = new Date(endsAt).getTime() - now;
  if (!Number.isFinite(diff) || diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  const label = days > 0
    ? `${days}d ${pad(hours)}h ${pad(minutes)}min`
    : `${pad(hours)}h ${pad(minutes)}min ${pad(seconds)}s`;

  return (
    <p className={cn("text-xs tracking-wide text-primary", className)}>
      {prefix} {label}
    </p>
  );
};
