"use client";

import { useState } from "react";
import { Minus, Package, Plus, Trash2, X } from "lucide-react";
import type { CartItem, ProductoPackaging } from "@/lib/types";
import { packagingPorId } from "@/lib/utils";
import PackagingModal from "./PackagingModal";

export default function PackagingDetailModal({
  item,
  packagingCatalogo,
  onIncrement,
  onDecrement,
  onRemove,
  onAdd,
  onClose,
}: {
  item: CartItem;
  packagingCatalogo: ProductoPackaging[];
  onIncrement: (packageId: string) => void;
  onDecrement: (packageId: string) => void;
  onRemove: (packageId: string) => void;
  onAdd: (packageId: string, cantidad: number) => void;
  onClose: () => void;
}) {
  const [addingOpen, setAddingOpen] = useState(false);
  const packagingMap = packagingPorId(packagingCatalogo);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-md rounded-xl border border-panel-2 bg-panel p-5 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-accent" />
            <div>
              <h3 className="text-base font-semibold text-ink">Packaging</h3>
              <p className="text-xs text-ink-soft">{item.nombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-soft hover:bg-panel-2 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {item.packaging.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-soft">
            Este producto no tiene packaging asignado todavía.
          </p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {item.packaging.map((p) => {
              const pkg = packagingMap.get(p.packageId);
              return (
                <li
                  key={p.packageId}
                  className="flex items-center gap-3 rounded-lg border border-panel-2 bg-canvas-soft p-2.5"
                >
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.nombre}
                      className="h-12 w-12 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded-md bg-panel-2" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {p.nombre}
                    </p>
                    {pkg && (
                      <p className="text-[11px] text-ink-soft">
                        {pkg.stock} disp.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onDecrement(p.packageId)}
                      className="rounded-md border border-panel-2 p-1 text-ink-soft transition-all duration-300 hover:bg-panel-2 hover:text-ink"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-sm text-ink">
                      {p.cantidadTotal}
                    </span>
                    <button
                      type="button"
                      onClick={() => onIncrement(p.packageId)}
                      className="rounded-md border border-panel-2 p-1 text-ink-soft transition-all duration-300 hover:bg-panel-2 hover:text-ink"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(p.packageId)}
                      className="ml-1 rounded-md p-1 text-ink-soft transition-all duration-300 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={() => setAddingOpen(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-panel-2 py-2.5 text-sm font-medium text-ink-soft transition-all duration-300 hover:border-accent/50 hover:text-accent"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar otro packaging
        </button>
      </div>

      {addingOpen && (
        <PackagingModal
          itemNombre={item.nombre}
          packagingCatalogo={packagingCatalogo}
          onAdd={(packageId, cantidad) => {
            onAdd(packageId, cantidad);
            setAddingOpen(false);
          }}
          onClose={() => setAddingOpen(false)}
        />
      )}
    </div>
  );
}
