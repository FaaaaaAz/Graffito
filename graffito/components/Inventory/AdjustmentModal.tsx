"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TipoMovimiento } from "@/lib/types";

const MOTIVOS_SALIDA: Array<{ value: TipoMovimiento; label: string }> = [
  { value: "ajuste", label: "Ajuste de inventario" },
  { value: "perdida", label: "Pérdida / daño" },
];

/** Minimal shape needed to render/submit an adjustment — satisfied by both `Producto` and `ProductoPackaging`. */
export interface AjustableItem {
  nombre: string;
  codigo: string;
  stock: number;
}

export default function AdjustmentModal({
  producto,
  mode,
  submitting,
  onClose,
  onSubmit,
}: {
  producto: AjustableItem;
  mode: "entrada" | "salida";
  submitting: boolean;
  onClose: () => void;
  onSubmit: (cantidad: number, tipo: TipoMovimiento, notas: string) => void;
}) {
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState<TipoMovimiento>("ajuste");
  const [notas, setNotas] = useState("");

  const isEntrada = mode === "entrada";
  const maxSalida = producto.stock;

  function handleSubmit() {
    if (cantidad <= 0) return;
    if (!isEntrada && cantidad > maxSalida) return;
    onSubmit(cantidad, isEntrada ? "entrada" : motivo, notas);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-panel-2 bg-panel p-5 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-ink">
            {isEntrada ? "Registrar entrada de stock" : "Registrar salida de stock"}
          </h3>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-ink-soft hover:bg-panel-2 hover:text-ink disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-panel-2 bg-canvas-soft p-3">
          <p className="text-sm font-medium text-ink">{producto.nombre}</p>
          <p className="text-xs text-ink-soft">
            {producto.codigo} · Stock actual: {producto.stock}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">
              Cantidad
            </label>
            <input
              type="number"
              min={1}
              max={isEntrada ? undefined : maxSalida}
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              className="w-full rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            />
            {!isEntrada && cantidad > maxSalida && (
              <p className="mt-1 text-xs text-red-400">
                No puedes retirar más de {maxSalida} unidades.
              </p>
            )}
          </div>

          {!isEntrada && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">
                Motivo
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MOTIVOS_SALIDA.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMotivo(m.value)}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-xs font-medium transition-all duration-300",
                      motivo === m.value
                        ? "border-accent bg-accent text-canvas"
                        : "border-panel-2 bg-canvas-soft text-ink-soft hover:text-ink"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">
              Notas (opcional)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-soft transition-all duration-300 hover:bg-panel-2 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              submitting || cantidad <= 0 || (!isEntrada && cantidad > maxSalida)
            }
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-canvas transition-all duration-300 hover:brightness-95 disabled:opacity-60"
          >
            {submitting ? "Guardando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
