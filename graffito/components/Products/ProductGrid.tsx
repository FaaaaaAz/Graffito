"use client";

import { useState } from "react";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import type { ProductoConVariantes } from "@/lib/types";
import {
  cn,
  formatCurrency,
  productStockStatus,
  stockStatusClasses,
  stockStatusLabel,
  totalStock,
} from "@/lib/utils";

export default function ProductGrid({
  productos,
  onEdit,
  onDelete,
}: {
  productos: ProductoConVariantes[];
  onEdit: (producto: ProductoConVariantes) => void;
  onDelete: (producto: ProductoConVariantes) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (productos.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-ink-soft">
        No se encontraron productos.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {productos.map((producto) => {
        const status = productStockStatus(producto.variantes);
        const stock = totalStock(producto.variantes);
        const expanded = expandedId === producto.id;

        return (
          <div
            key={producto.id}
            className="flex flex-col overflow-hidden rounded-xl border border-panel-2 bg-panel shadow-sm transition-all duration-300 hover:border-panel-2/60"
          >
            <div className="relative aspect-square w-full bg-panel-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={producto.imageUrl}
                alt={producto.nombre}
                className="h-full w-full object-cover"
              />
              <span
                className={cn(
                  "absolute right-2 top-2 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                  stockStatusClasses(status)
                )}
              >
                {stockStatusLabel(status)}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-4">
              <p className="truncate text-sm font-semibold text-ink">
                {producto.nombre}
              </p>
              <p className="text-xs text-ink-soft">{producto.categoria}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-base font-semibold text-gold">
                  {formatCurrency(producto.precio)}
                </span>
                <span className="text-xs text-ink-soft">{stock} u. total</span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setExpandedId(expanded ? null : producto.id)
                }
                className="mt-3 flex items-center justify-between rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-xs font-medium text-ink-soft transition-all duration-300 hover:text-ink"
              >
                Ver variantes ({producto.variantes.length})
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-300",
                    expanded && "rotate-180"
                  )}
                />
              </button>

              {expanded && (
                <ul className="mt-2 space-y-1.5 rounded-lg bg-canvas-soft p-2.5">
                  {producto.variantes.map((variante) => {
                    const variantStatus = productStockStatus([variante]);
                    return (
                      <li
                        key={variante.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-ink">{variante.nombre}</span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 font-medium",
                            stockStatusClasses(variantStatus)
                          )}
                        >
                          {variante.stock} u.
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="mt-3 flex gap-2 border-t border-panel-2 pt-3">
                <button
                  type="button"
                  onClick={() => onEdit(producto)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-panel-2 px-3 py-2 text-xs font-medium text-ink transition-all duration-300 hover:bg-panel-2/70"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(producto)}
                  className="flex items-center justify-center rounded-lg bg-panel-2 px-3 py-2 text-red-400 transition-all duration-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
