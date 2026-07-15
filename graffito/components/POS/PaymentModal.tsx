"use client";

import { CheckCircle2, X } from "lucide-react";
import type { CartItem, MetodoPago } from "@/lib/types";
import { formatCurrency, grabadoLineas } from "@/lib/utils";

export default function PaymentModal({
  items,
  metodoPago,
  cliente,
  celular,
  submitting,
  onClose,
  onConfirm,
}: {
  items: CartItem[];
  metodoPago: MetodoPago;
  cliente: string;
  celular: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const total = items.reduce(
    (sum, item) => sum + item.precioUnitario * item.cantidad,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-panel-2 bg-panel p-5 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-ink">
            Confirmar venta
          </h3>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-ink-soft hover:bg-panel-2 hover:text-ink disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-panel-2 bg-canvas-soft p-3">
          {items.map((item) => {
            const lineas = grabadoLineas(item.grabado);
            return (
              <div key={item.productoId} className="flex items-start justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-ink">
                    {item.cantidad}x {item.nombre}
                  </p>
                  {lineas.map((linea, index) => (
                    <p key={index} className="truncate text-xs text-ink-soft">
                      {linea.label}: &ldquo;{linea.value}&rdquo;
                    </p>
                  ))}
                  {item.packaging.length > 0 && (
                    <p className="truncate text-xs text-ink-soft">
                      Packaging:{" "}
                      {item.packaging
                        .map((p) => `${p.nombre} (${p.cantidadTotal}x)`)
                        .join(", ")}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-medium text-ink">
                  {formatCurrency(item.precioUnitario * item.cantidad)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 space-y-1 text-sm text-ink-soft">
          <div className="flex justify-between">
            <span>Método de pago</span>
            <span className="text-ink">{metodoPago}</span>
          </div>
          <div className="flex justify-between">
            <span>Cliente</span>
            <span className="text-ink">{cliente}</span>
          </div>
          <div className="flex justify-between">
            <span>Celular</span>
            <span className="text-ink">{celular}</span>
          </div>
        </div>

        <div className="mt-3 flex justify-between border-t border-panel-2 pt-3 text-lg font-semibold">
          <span className="text-ink">Total</span>
          <span className="text-gold">{formatCurrency(total)}</span>
        </div>

        <button
          type="button"
          disabled={submitting}
          onClick={onConfirm}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-canvas transition-all duration-300 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircle2 className="h-4 w-4" />
          {submitting ? "Procesando venta..." : "Confirmar y registrar venta"}
        </button>
      </div>
    </div>
  );
}
