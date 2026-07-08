import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StatCard({
  icon: Icon,
  label,
  value,
  accent = "default",
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: "default" | "accent" | "gold" | "danger";
  hint?: string;
}) {
  const accentClasses = {
    default: "bg-panel-2 text-ink",
    accent: "bg-accent/15 text-accent",
    gold: "bg-gold/15 text-gold",
    danger: "bg-red-500/15 text-red-400",
  }[accent];

  const valueClasses = {
    default: "text-ink",
    accent: "text-accent",
    gold: "text-gold",
    danger: "text-red-400",
  }[accent];

  return (
    <div className="rounded-xl border border-panel-2 bg-panel p-5 shadow-sm transition-all duration-300 hover:border-panel-2/80">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-soft">{label}</p>
          <p className={cn("mt-2 text-2xl font-semibold", valueClasses)}>
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
        </div>
        <div className={cn("rounded-lg p-2.5", accentClasses)}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
