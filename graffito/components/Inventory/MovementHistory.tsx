"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { MovimientoStock } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

const TIPO_LABEL: Record<MovimientoStock["tipo"], string> = {
  entrada: "Entrada",
  salida: "Salida",
  venta: "Venta",
  ajuste: "Ajuste",
  perdida: "Pérdida / daño",
};

const TIPO_CLASSES: Record<MovimientoStock["tipo"], string> = {
  entrada: "bg-emerald-500/15 text-emerald-400",
  salida: "bg-red-500/15 text-red-400",
  venta: "bg-accent/15 text-accent",
  ajuste: "bg-panel-2 text-ink-soft",
  perdida: "bg-red-500/15 text-red-400",
};

export default function MovementHistory({
  movimientos,
}: {
  movimientos: MovimientoStock[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-panel-2 bg-panel shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <h3 className="text-sm font-semibold text-ink">
          Historial de movimientos (últimos {movimientos.length})
        </h3>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-ink-soft transition-transform duration-300",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="border-t border-panel-2 px-5 py-4">
          {movimientos.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-soft">
              No hay movimientos registrados.
            </p>
          ) : (
            <ul className="space-y-2">
              {movimientos.map((mov) => (
                <li
                  key={mov.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-canvas-soft px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-ink">
                      {mov.nombre} · {mov.codigo}
                      {mov.esPackaging && (
                        <span className="ml-1.5 rounded bg-accent/15 px-1.5 py-0.5 text-[9px] font-medium text-accent">
                          Packaging
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {formatDateTime(mov.fecha)} · Administrador
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-xs font-medium",
                        TIPO_CLASSES[mov.tipo]
                      )}
                    >
                      {TIPO_LABEL[mov.tipo]}
                    </span>
                    <span className="w-10 text-right font-medium text-ink">
                      {mov.tipo === "entrada" ? "+" : "-"}
                      {Math.abs(mov.cantidad)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
