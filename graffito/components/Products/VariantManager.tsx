"use client";

import { Plus, Trash2 } from "lucide-react";

export interface VariantDraft {
  id?: string;
  nombre: string;
  stock: number;
  stockMinimo: number;
  imageUrl: string;
}

export default function VariantManager({
  variantes,
  onChange,
  stockMinimoDefault,
}: {
  variantes: VariantDraft[];
  onChange: (variantes: VariantDraft[]) => void;
  stockMinimoDefault: number;
}) {
  function updateRow(index: number, patch: Partial<VariantDraft>) {
    onChange(
      variantes.map((v, i) => (i === index ? { ...v, ...patch } : v))
    );
  }

  function addRow() {
    onChange([
      ...variantes,
      { nombre: "", stock: 0, stockMinimo: stockMinimoDefault, imageUrl: "" },
    ]);
  }

  function removeRow(index: number) {
    onChange(variantes.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-soft">
          Variantes ({variantes.length})
        </p>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 rounded-lg bg-panel-2 px-2.5 py-1.5 text-xs font-medium text-ink transition-all duration-300 hover:bg-panel-2/70"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar variante
        </button>
      </div>

      {variantes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-panel-2 py-4 text-center text-xs text-ink-soft">
          Sin variantes definidas. Se creará una variante &ldquo;Estándar&rdquo;
          automáticamente.
        </p>
      ) : (
        <div className="space-y-2">
          {variantes.map((variante, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 rounded-lg border border-panel-2 bg-canvas-soft p-2.5"
            >
              <input
                type="text"
                value={variante.nombre}
                onChange={(e) => updateRow(index, { nombre: e.target.value })}
                placeholder="Nombre (ej. Negro)"
                className="col-span-12 rounded-md border border-panel-2 bg-panel px-2 py-1.5 text-xs text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none sm:col-span-4"
              />
              <input
                type="number"
                min={0}
                value={variante.stock}
                onChange={(e) =>
                  updateRow(index, { stock: Number(e.target.value) })
                }
                placeholder="Stock"
                className="col-span-4 rounded-md border border-panel-2 bg-panel px-2 py-1.5 text-xs text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none sm:col-span-2"
              />
              <input
                type="number"
                min={0}
                value={variante.stockMinimo}
                onChange={(e) =>
                  updateRow(index, { stockMinimo: Number(e.target.value) })
                }
                placeholder="Mínimo"
                className="col-span-4 rounded-md border border-panel-2 bg-panel px-2 py-1.5 text-xs text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none sm:col-span-2"
              />
              <input
                type="text"
                value={variante.imageUrl}
                onChange={(e) =>
                  updateRow(index, { imageUrl: e.target.value })
                }
                placeholder="URL de imagen (opcional)"
                className="col-span-10 rounded-md border border-panel-2 bg-panel px-2 py-1.5 text-xs text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none sm:col-span-3"
              />
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="col-span-2 flex items-center justify-center rounded-md bg-panel text-red-400 transition-all duration-300 hover:bg-red-500/10 sm:col-span-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
