"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { ProductoPackaging } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function PackagingModal({
  itemNombre,
  packagingCatalogo,
  onAdd,
  onClose,
}: {
  itemNombre: string;
  packagingCatalogo: ProductoPackaging[];
  onAdd: (packageId: string, cantidad: number) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(1);

  function handleConfirm() {
    if (!selected || cantidad <= 0) return;
    onAdd(selected, cantidad);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-md rounded-xl border border-panel-2 bg-panel p-5 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-ink">
              Agregar packaging
            </h3>
            <p className="text-xs text-ink-soft">{itemNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-soft hover:bg-panel-2 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {packagingCatalogo.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-soft">
            No hay packaging disponible.
          </p>
        ) : (
          <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1">
            {packagingCatalogo.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelected(pkg.id)}
                disabled={pkg.stock <= 0}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40",
                  selected === pkg.id
                    ? "border-accent bg-accent/10"
                    : "border-panel-2 hover:border-panel-2/60"
                )}
              >
                {pkg.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pkg.imageUrl}
                    alt={pkg.nombre}
                    className="h-14 w-14 rounded-md object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-md bg-panel-2" />
                )}
                <span className="text-[11px] font-medium leading-tight text-ink">
                  {pkg.nombre}
                </span>
                <span className="text-[10px] text-ink-soft">
                  {pkg.stock} disp.
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <label className="text-xs font-medium text-ink-soft">
            Cantidad
          </label>
          <input
            type="number"
            min={1}
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
            className="w-20 rounded-lg border border-panel-2 bg-canvas-soft px-3 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
          />
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-soft transition-all duration-300 hover:bg-panel-2"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-canvas transition-all duration-300 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
