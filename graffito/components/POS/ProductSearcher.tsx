"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { ProductoConVariantes, Variante } from "@/lib/types";
import { formatCurrency, totalStock } from "@/lib/utils";
import Loading from "@/components/Common/Loading";

export default function ProductSearcher({
  productos,
  loading,
  onSelect,
}: {
  productos: ProductoConVariantes[];
  loading: boolean;
  onSelect: (producto: ProductoConVariantes, variante: Variante) => void;
}) {
  const [search, setSearch] = useState("");
  const [pendingProducto, setPendingProducto] =
    useState<ProductoConVariantes | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return productos;
    return productos.filter((p) =>
      `${p.nombre} ${p.categoria}`.toLowerCase().includes(term)
    );
  }, [productos, search]);

  function handleClick(producto: ProductoConVariantes) {
    if (totalStock(producto.variantes) <= 0) return;
    if (producto.variantes.length <= 1) {
      const variante = producto.variantes[0];
      if (variante) onSelect(producto, variante);
      return;
    }
    setPendingProducto(producto);
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-panel-2 bg-panel p-4 shadow-sm">
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto por nombre..."
          className="w-full rounded-lg border border-panel-2 bg-canvas-soft py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
        />
      </div>

      {loading ? (
        <Loading label="Cargando productos..." />
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-soft">
          No se encontraron productos.
        </p>
      ) : (
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((producto) => {
            const stock = totalStock(producto.variantes);
            const agotado = stock <= 0;
            return (
              <button
                key={producto.id}
                type="button"
                disabled={agotado}
                onClick={() => handleClick(producto)}
                className="group flex flex-col overflow-hidden rounded-lg border border-panel-2 bg-canvas-soft text-left transition-all duration-300 hover:border-accent/50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-panel-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={producto.imageUrl}
                    alt={producto.nombre}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {agotado && (
                    <span className="absolute right-1.5 top-1.5 rounded-md bg-red-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      Agotado
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="truncate text-sm font-medium text-ink">
                    {producto.nombre}
                  </p>
                  <p className="truncate text-xs text-ink-soft">
                    {producto.categoria}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gold">
                    {formatCurrency(producto.precio)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {pendingProducto && (
        <VariantSelectorModal
          producto={pendingProducto}
          onClose={() => setPendingProducto(null)}
          onSelect={(variante) => {
            onSelect(pendingProducto, variante);
            setPendingProducto(null);
          }}
        />
      )}
    </div>
  );
}

function VariantSelectorModal({
  producto,
  onClose,
  onSelect,
}: {
  producto: ProductoConVariantes;
  onClose: () => void;
  onSelect: (variante: Variante) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-panel-2 bg-panel p-5 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-ink">
              {producto.nombre}
            </h3>
            <p className="text-sm text-ink-soft">Elige una variante</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-soft hover:bg-panel-2 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-80 space-y-2 overflow-y-auto">
          {producto.variantes.map((variante) => {
            const agotado = variante.stock <= 0;
            return (
              <button
                key={variante.id}
                type="button"
                disabled={agotado}
                onClick={() => onSelect(variante)}
                className="flex w-full items-center gap-3 rounded-lg border border-panel-2 bg-canvas-soft p-2.5 text-left transition-all duration-300 hover:border-accent/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={variante.imageUrl || producto.imageUrl}
                  alt={variante.nombre}
                  className="h-12 w-12 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {variante.nombre}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {agotado ? "Sin stock" : `${variante.stock} disponibles`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
