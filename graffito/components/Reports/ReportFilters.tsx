"use client";

import { cn, dateKey } from "@/lib/utils";

export type PresetRango = "7dias" | "30dias" | "mes" | "personalizado";

const PRESETS: Array<{ value: PresetRango; label: string }> = [
  { value: "7dias", label: "Últimos 7 días" },
  { value: "30dias", label: "Últimos 30 días" },
  { value: "mes", label: "Este mes" },
  { value: "personalizado", label: "Personalizado" },
];

export function rangoFromPreset(preset: PresetRango): {
  fechaInicio: string;
  fechaFin: string;
} {
  const hoy = new Date();
  const fin = dateKey(hoy);

  if (preset === "mes") {
    const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return { fechaInicio: dateKey(primero), fechaFin: fin };
  }

  const dias = preset === "30dias" ? 30 : 7;
  const inicio = new Date(hoy);
  inicio.setDate(inicio.getDate() - (dias - 1));
  return { fechaInicio: dateKey(inicio), fechaFin: fin };
}

export default function ReportFilters({
  preset,
  fechaInicio,
  fechaFin,
  onPresetChange,
  onCustomChange,
}: {
  preset: PresetRango;
  fechaInicio: string;
  fechaFin: string;
  onPresetChange: (preset: PresetRango) => void;
  onCustomChange: (fechaInicio: string, fechaFin: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-panel-2 bg-panel p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onPresetChange(p.value)}
            className={cn(
              "rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-300",
              preset === p.value
                ? "border-accent bg-accent text-canvas"
                : "border-panel-2 bg-canvas-soft text-ink-soft hover:text-ink"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === "personalizado" && (
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">
              Desde
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => onCustomChange(e.target.value, fechaFin)}
              className="rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">
              Hasta
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => onCustomChange(fechaInicio, e.target.value)}
              className="rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
