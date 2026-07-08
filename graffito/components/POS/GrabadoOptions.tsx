"use client";

import { PenLine } from "lucide-react";
import type { CartItem } from "@/lib/types";

export default function GrabadoOptions({
  item,
  onChange,
}: {
  item: CartItem | null;
  onChange: (grabado: boolean, textoGrabado: string) => void;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-panel-2 bg-panel p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <PenLine className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-ink">
          Grabado personalizado
        </h3>
      </div>

      {!item ? (
        <p className="py-10 text-center text-sm text-ink-soft">
          Selecciona un producto del carrito para agregar un grabado.
        </p>
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="mb-4 rounded-lg border border-panel-2 bg-canvas-soft p-3">
            <p className="truncate text-sm font-medium text-ink">
              {item.nombreProducto}
            </p>
            <p className="text-xs text-ink-soft">{item.nombreVariante}</p>
          </div>

          <label className="mb-3 flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={item.grabado}
              onChange={(e) => onChange(e.target.checked, item.textoGrabado)}
              className="h-4 w-4 rounded border-panel-2 accent-[#F5C518]"
            />
            ¿Incluye grabado?
          </label>

          {item.grabado && (
            <div className="flex flex-1 flex-col">
              <textarea
                value={item.textoGrabado}
                onChange={(e) => onChange(true, e.target.value)}
                placeholder='Ej. "Feliz Día Papá"'
                rows={4}
                className="w-full resize-none rounded-lg border border-panel-2 bg-canvas-soft p-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
              />
              <p className="mt-2 text-xs text-ink-soft">
                El grabado es solo informativo: no afecta el precio ni el
                stock.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
