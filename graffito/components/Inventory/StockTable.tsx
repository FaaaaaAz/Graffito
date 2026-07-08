"use client";

import { Minus, Plus } from "lucide-react";
import type { StockRow } from "@/hooks/useInventory";
import { cn, stockStatus, stockStatusClasses, stockStatusLabel } from "@/lib/utils";

export default function StockTable({
  rows,
  onRequestIncrease,
  onRequestDecrease,
}: {
  rows: StockRow[];
  onRequestIncrease: (row: StockRow) => void;
  onRequestDecrease: (row: StockRow) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-ink-soft">
        No hay variantes registradas todavía.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-panel-2 bg-panel shadow-sm">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-panel-2 text-xs uppercase tracking-wide text-ink-soft">
            <th className="px-4 py-3 font-medium">Producto</th>
            <th className="px-4 py-3 font-medium">Variante</th>
            <th className="px-4 py-3 font-medium">Stock actual</th>
            <th className="px-4 py-3 font-medium">Stock mínimo</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 text-right font-medium">Ajustar</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const status = stockStatus(row.variante.stock, row.variante.stockMinimo);
            return (
              <tr
                key={`${row.producto.id}-${row.variante.id}`}
                className="border-b border-panel-2 last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={row.variante.imageUrl || row.producto.imageUrl}
                      alt={row.producto.nombre}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                    <div>
                      <p className="font-medium text-ink">{row.producto.nombre}</p>
                      <p className="text-xs text-ink-soft">{row.producto.categoria}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink">{row.variante.nombre}</td>
                <td className="px-4 py-3 font-semibold text-ink">
                  {row.variante.stock}
                </td>
                <td className="px-4 py-3 text-ink-soft">{row.variante.stockMinimo}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-xs font-semibold",
                      stockStatusClasses(status)
                    )}
                  >
                    {stockStatusLabel(status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onRequestDecrease(row)}
                      disabled={row.variante.stock <= 0}
                      className="rounded-md border border-panel-2 p-1.5 text-ink-soft transition-all duration-300 hover:bg-panel-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRequestIncrease(row)}
                      className="rounded-md border border-panel-2 p-1.5 text-ink-soft transition-all duration-300 hover:bg-panel-2 hover:text-ink"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
