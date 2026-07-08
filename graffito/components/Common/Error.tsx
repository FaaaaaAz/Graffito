import { AlertTriangle } from "lucide-react";

export default function ErrorMessage({
  title = "Ocurrió un error",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-10 text-center">
      <AlertTriangle className="h-8 w-8 text-red-400" />
      <p className="font-medium text-ink">{title}</p>
      {message && <p className="max-w-md text-sm text-ink-soft">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-lg bg-panel-2 px-4 py-2 text-sm font-medium text-ink transition-all duration-300 hover:bg-panel"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
