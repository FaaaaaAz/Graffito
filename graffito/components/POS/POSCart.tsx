"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { CartItem, MetodoPago } from "@/lib/types";
import { cn, formatCurrency, tieneGrabado } from "@/lib/utils";

const METODOS: MetodoPago[] = ["Efectivo", "Tarjeta", "Transferencia"];

export default function POSCart({
  items,
  selectedId,
  onSelect,
  onIncrement,
  onDecrement,
  onRemove,
  metodoPago,
  onMetodoPagoChange,
  cliente,
  onClienteChange,
  celular,
  onCelularChange,
  onConfirm,
}: {
  items: CartItem[];
  selectedId: string | null;
  onSelect: (productoId: string) => void;
  onIncrement: (productoId: string) => void;
  onDecrement: (productoId: string) => void;
  onRemove: (productoId: string) => void;
  metodoPago: MetodoPago;
  onMetodoPagoChange: (metodo: MetodoPago) => void;
  cliente: string;
  onClienteChange: (cliente: string) => void;
  celular: string;
  onCelularChange: (celular: string) => void;
  onConfirm: () => void;
}) {
  const [showErrors, setShowErrors] = useState(false);

  const subtotal = items.reduce(
    (sum, item) => sum + item.precioUnitario * item.cantidad,
    0
  );
  const impuesto = 0;
  const total = subtotal + impuesto;

  const clienteInvalido = showErrors && !cliente.trim();
  const celularInvalido = showErrors && !celular.trim();

  function handleConfirmClick() {
    if (!cliente.trim() || !celular.trim()) {
      setShowErrors(true);
      toast.error("Por favor ingresa nombre y celular del cliente");
      return;
    }
    setShowErrors(false);
    onConfirm();
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-panel-2 bg-panel p-4 shadow-sm">
      <div className="mb-3 flex shrink-0 items-center gap-2">
        <ShoppingCart className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-ink">
          Carrito ({items.length})
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-soft">
            Agrega productos desde el buscador.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.productoId}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(item.productoId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(item.productoId);
                  }
                }}
                className={cn(
                  "w-full cursor-pointer rounded-lg border p-2.5 text-left transition-all duration-300",
                  selectedId === item.productoId
                    ? "border-accent bg-accent/5"
                    : "border-panel-2 bg-canvas-soft hover:border-panel-2/60"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {item.nombre}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {item.codigo}
                      {tieneGrabado(item.grabado) && (
                        <span className="ml-1.5 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                          Grabado
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.productoId);
                    }}
                    className="shrink-0 rounded p-1 text-ink-soft hover:bg-panel-2 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div
                    className="flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onDecrement(item.productoId)}
                      className="rounded-md border border-panel-2 p-1 text-ink-soft transition-all duration-300 hover:bg-panel-2 hover:text-ink"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm text-ink">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => onIncrement(item.productoId)}
                      disabled={item.cantidad >= item.stockDisponible}
                      className="rounded-md border border-panel-2 p-1 text-ink-soft transition-all duration-300 hover:bg-panel-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-gold">
                    {formatCurrency(item.precioUnitario * item.cantidad)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-3 border-t border-panel-2 pt-4">
          <div>
            <p className="mb-1.5 text-xs font-medium text-ink-soft">
              Método de pago
            </p>
            <div className="grid grid-cols-3 gap-2">
              {METODOS.map((metodo) => (
                <button
                  key={metodo}
                  type="button"
                  onClick={() => onMetodoPagoChange(metodo)}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-xs font-medium transition-all duration-300",
                    metodoPago === metodo
                      ? "border-accent bg-accent text-canvas"
                      : "border-panel-2 bg-canvas-soft text-ink-soft hover:text-ink"
                  )}
                >
                  {metodo}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-ink-soft">
              Cliente <span className="text-red-400">*</span>
            </p>
            <input
              type="text"
              value={cliente}
              onChange={(e) => onClienteChange(e.target.value)}
              placeholder="Nombre del cliente"
              className={cn(
                "w-full rounded-lg border bg-canvas-soft px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none",
                clienteInvalido
                  ? "border-red-500 focus:border-red-500"
                  : "border-panel-2 focus:border-accent"
              )}
            />
            {clienteInvalido && (
              <p className="mt-1 text-xs text-red-400">El nombre es obligatorio.</p>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-ink-soft">
              Celular <span className="text-red-400">*</span>
            </p>
            <input
              type="tel"
              value={celular}
              onChange={(e) => onCelularChange(e.target.value)}
              placeholder="Ej. 70012345"
              className={cn(
                "w-full rounded-lg border bg-canvas-soft px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none",
                celularInvalido
                  ? "border-red-500 focus:border-red-500"
                  : "border-panel-2 focus:border-accent"
              )}
            />
            {celularInvalido && (
              <p className="mt-1 text-xs text-red-400">El celular es obligatorio.</p>
            )}
          </div>

          <div className="space-y-1 rounded-lg bg-canvas-soft p-3 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Impuesto</span>
              <span>{formatCurrency(impuesto)}</span>
            </div>
            <div className="flex justify-between border-t border-panel-2 pt-1.5 text-base font-semibold">
              <span className="text-ink">Total</span>
              <span className="text-gold">{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={items.length === 0}
            className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-canvas transition-all duration-300 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirmar venta
          </button>
        </div>
      </div>
    </div>
  );
}
