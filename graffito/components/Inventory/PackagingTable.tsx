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

export default function PackagingTable({
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
        No hay packaging registrado todavía.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-panel-2 bg-panel shadow-sm">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-panel-2 text-xs uppercase tracking-wide text-ink-soft">
            <th className="px-4 py-3 font-medium">Packaging</th>
            <th className="px-4 py-3 font-medium">Categoría</th>
            <th className="px-4 py-3 font-medium">Stock actual</th>
            <th className="px-4 py-3 font-medium">Stock mínimo</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 text-right font-medium">Ajustar</th>
          </tr>
        </thead>
        <tbody>
          {packaging.map((pkg) => {
            const status = stockStatus(pkg.stock, pkg.stockMinimo);
            return (
              <tr key={pkg.id} className="border-b border-panel-2 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {pkg.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pkg.imageUrl}
                        alt={pkg.nombre}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-panel-2 text-[9px] text-ink-soft">
                        Sin foto
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-ink">{pkg.nombre}</p>
                      <p className="text-xs text-ink-soft">{pkg.codigo}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {packagingCategoriaLabel(pkg.categoria)}
                  {pkg.tamanio ? ` · ${pkg.tamanio}` : ""}
                </td>
                <td className="px-4 py-3 font-semibold text-ink">{pkg.stock}</td>
                <td className="px-4 py-3 text-ink-soft">{pkg.stockMinimo}</td>
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
                      onClick={() => onRequestDecrease(pkg)}
                      disabled={pkg.stock <= 0}
                      className="rounded-md border border-panel-2 p-1.5 text-ink-soft transition-all duration-300 hover:bg-panel-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRequestIncrease(pkg)}
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
