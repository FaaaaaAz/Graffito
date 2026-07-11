"use client";

import { Minus, Plus } from "lucide-react";
import type { ProductoPackaging } from "@/lib/types";
import {
  cn,
  packagingCategoriaLabel,
  stockStatus,
  stockStatusClasses,
  stockStatusLabel,
} from "@/lib/utils";

export default function PackagingGrid({
  packaging,
  onRequestIncrease,
  onRequestDecrease,
}: {
  packaging: ProductoPackaging[];
  onRequestIncrease: (pkg: ProductoPackaging) => void;
  onRequestDecrease: (pkg: ProductoPackaging) => void;
}) {
  if (packaging.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-ink-soft">
        No se encontró packaging.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {packaging.map((pkg) => {
        const status = stockStatus(pkg.stock, pkg.stockMinimo);

        return (
          <div
            key={pkg.id}
            className="flex flex-col overflow-hidden rounded-xl border border-panel-2 bg-panel shadow-sm transition-all duration-300 hover:border-panel-2/60"
          >
            <div className="relative aspect-square w-full bg-panel-2">
              {pkg.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pkg.imageUrl}
                  alt={pkg.nombre}
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
                {pkg.codigo}
              </p>
              <p className="truncate text-sm font-semibold text-ink">
                {pkg.nombre}
              </p>
              <p className="text-xs text-ink-soft">
                {packagingCategoriaLabel(pkg.categoria)}
                {pkg.tamanio ? ` · ${pkg.tamanio}` : ""}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-ink-soft">Stock</span>
                <span className="text-base font-semibold text-ink">
                  {pkg.stock} u.
                </span>
              </div>

              <div className="mt-3 flex gap-2 border-t border-panel-2 pt-3">
                <button
                  type="button"
                  onClick={() => onRequestDecrease(pkg)}
                  disabled={pkg.stock <= 0}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-panel-2 px-3 py-2 text-xs font-medium text-ink transition-all duration-300 hover:bg-panel-2/70 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus className="h-3.5 w-3.5" />
                  Salida
                </button>
                <button
                  type="button"
                  onClick={() => onRequestIncrease(pkg)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-panel-2 px-3 py-2 text-xs font-medium text-ink transition-all duration-300 hover:bg-panel-2/70"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Entrada
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
