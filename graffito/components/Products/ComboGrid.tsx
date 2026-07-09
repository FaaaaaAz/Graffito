"use client";

import { AlertTriangle, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import type { Producto } from "@/lib/types";
import {
  cn,
  formatCurrency,
  stockStatus,
  stockStatusClasses,
  stockStatusLabel,
} from "@/lib/utils";

function ComponentRow({
  label,
  producto,
}: {
  label: string;
  producto: Producto | undefined;
}) {
  if (!producto) {
    return (
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-soft">{label}</span>
        <span className="flex items-center gap-1 font-medium text-red-400">
          <AlertTriangle className="h-3 w-3" />
          No encontrado
        </span>
      </div>
    );
  }

  const status = stockStatus(producto.stock, producto.stockMinimo);
  const ok = status === "en-stock";

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="truncate text-ink-soft">
        {label}: {producto.nombre}
      </span>
      <span
        className={cn(
          "flex shrink-0 items-center gap-1 font-medium",
          ok ? "text-emerald-400" : "text-red-400"
        )}
      >
        {ok ? (
          <CheckCircle2 className="h-3 w-3" />
        ) : (
          <AlertTriangle className="h-3 w-3" />
        )}
        {producto.stock} u.
      </span>
    </div>
  );
}

export default function ComboGrid({
  combos,
  productosPorCodigo,
  onEdit,
  onDelete,
}: {
  combos: Producto[];
  productosPorCodigo: Map<string, Producto>;
  onEdit: (producto: Producto) => void;
  onDelete: (producto: Producto) => void;
}) {
  if (combos.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-ink-soft">
        No se encontraron combos.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {combos.map((combo) => {
        const status = stockStatus(combo.stock, combo.stockMinimo);
        const agenda = combo.itemsBase?.find((i) => i.tipoProducto === "agenda");
        const boligrafo = combo.itemsBase?.find((i) => i.tipoProducto === "muller");

        return (
          <div
            key={combo.id}
            className="flex flex-col overflow-hidden rounded-xl border border-panel-2 bg-panel shadow-sm transition-all duration-300 hover:border-panel-2/60"
          >
            <div className="relative aspect-square w-full bg-panel-2">
              {combo.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={combo.imageUrl}
                  alt={combo.nombre}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-ink-soft">
                  Sin imagen
                </div>
              )}
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
              <p className="truncate text-[10px] font-medium uppercase tracking-wide text-ink-soft">
                {combo.codigo}
              </p>
              <p className="truncate text-sm font-semibold text-ink">
                {combo.nombre}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-base font-semibold text-gold">
                  {formatCurrency(combo.precio)}
                </span>
                <span className="text-xs text-ink-soft">
                  Stock: {combo.stock} u.
                </span>
              </div>

              <div className="mt-3 space-y-1.5 rounded-lg bg-canvas-soft p-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wide text-ink-soft">
                  Componentes
                </p>
                <ComponentRow
                  label="Agenda"
                  producto={
                    agenda ? productosPorCodigo.get(agenda.codigo) : undefined
                  }
                />
                <ComponentRow
                  label="Bolígrafo"
                  producto={
                    boligrafo ? productosPorCodigo.get(boligrafo.codigo) : undefined
                  }
                />
              </div>

              <div className="mt-3 flex gap-2 border-t border-panel-2 pt-3">
                <button
                  type="button"
                  onClick={() => onEdit(combo)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-panel-2 px-3 py-2 text-xs font-medium text-ink transition-all duration-300 hover:bg-panel-2/70"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(combo)}
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
