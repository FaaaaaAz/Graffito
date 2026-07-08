import { cn } from "@/lib/utils";

export default function Loading({
  label = "Cargando...",
  fullScreen = false,
  className,
}: {
  label?: string;
  fullScreen?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-ink-soft",
        fullScreen ? "h-screen w-full bg-canvas" : "py-16",
        className
      )}
    >
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-panel-2 border-t-accent" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
