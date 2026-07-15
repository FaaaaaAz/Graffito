"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import type { Venta } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function DeleteSaleModal({
  venta,
  onConfirm,
  onCancel,
}: {
  venta: Venta;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const cantidadTotal = venta.items.reduce((sum, i) => sum + i.cantidad, 0);

  async function handleConfirm() {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-panel-2 bg-panel p-5 shadow-md">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-500/10 p-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-ink">
                Eliminar venta
              </h3>
              <p className="mt-0.5 text-sm text-ink-soft">
                Esta acción <strong className="text-ink">no se puede deshacer</strong>{" "}
                y revertirá automáticamente:
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={deleting}
            className="shrink-0 rounded-lg p-1.5 text-ink-soft hover:bg-panel-2 hover:text-ink disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="mb-4 list-inside list-disc space-y-1 pl-1 text-sm text-ink-soft">
          <li>Stock de los productos vendidos</li>
          <li>Stock del packaging usado</li>
          <li>Los movimientos de inventario que generó</li>
          <li>Los totales del día</li>
        </ul>

        <div className="space-y-1.5 rounded-lg border border-panel-2 bg-canvas-soft p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-soft">Fecha</span>
            <span className="text-ink">{formatDateTime(venta.fecha)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">Cliente</span>
            <span className="text-ink">{venta.cliente || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">Productos</span>
            <span className="text-ink">
              {cantidadTotal} unidad{cantidadTotal === 1 ? "" : "es"} ·{" "}
              {venta.items.length} línea{venta.items.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex justify-between border-t border-panel-2 pt-1.5 font-semibold">
            <span className="text-ink">Total</span>
            <span className="text-gold">{formatCurrency(venta.total)}</span>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-soft transition-all duration-300 hover:bg-panel-2 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Eliminando..." : "Sí, eliminar venta"}
          </button>
        </div>
      </div>
    </div>
  );
}
