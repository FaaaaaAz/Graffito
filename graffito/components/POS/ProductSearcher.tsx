"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Categoria, Producto } from "@/lib/types";
import { cn, formatCurrency, productosPorCodigo, stockDisponible } from "@/lib/utils";
import Loading from "@/components/Common/Loading";

export default function ProductSearcher({
  productos,
  categorias,
  loading,
  onSelect,
}: {
  productos: Producto[];
  categorias: Categoria[];
  loading: boolean;
  onSelect: (producto: Producto, stockDisponible: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");

  const porCodigo = useMemo(() => productosPorCodigo(productos), [productos]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return productos.filter((p) => {
      const matchesTerm =
        !term ||
        p.nombre.toLowerCase().includes(term) ||
        p.codigo.toLowerCase().includes(term);
      const matchesCategoria =
        categoriaFiltro === "Todas" || p.categoria === categoriaFiltro;
      return matchesTerm && matchesCategoria;
    });
  }, [productos, search, categoriaFiltro]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-panel-2 bg-panel p-4 shadow-sm">
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o código..."
          className="w-full rounded-lg border border-panel-2 bg-canvas-soft py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setCategoriaFiltro("Todas")}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-all duration-300",
            categoriaFiltro === "Todas"
              ? "border-accent bg-accent text-canvas"
              : "border-panel-2 bg-canvas-soft text-ink-soft hover:text-ink"
          )}
        >
          Todas
        </button>
        {categorias.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoriaFiltro(cat.nombre)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-all duration-300",
              categoriaFiltro === cat.nombre
                ? "border-accent bg-accent text-canvas"
                : "border-panel-2 bg-canvas-soft text-ink-soft hover:text-ink"
            )}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading label="Cargando productos..." />
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-soft">
          No se encontraron productos.
        </p>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((producto) => {
            const disponible = stockDisponible(producto, porCodigo);
            const agotado = disponible <= 0;
            return (
              <div
                key={producto.id}
                role="button"
                tabIndex={agotado ? -1 : 0}
                aria-disabled={agotado}
                onClick={() => !agotado && onSelect(producto, disponible)}
                onKeyDown={(e) => {
                  if (!agotado && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onSelect(producto, disponible);
                  }
                }}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-lg border border-panel-2 bg-canvas-soft text-left transition-all duration-300 hover:border-accent/50 hover:shadow-md",
                  agotado
                    ? "cursor-not-allowed opacity-40"
                    : "cursor-pointer"
                )}
              >
                <div className="relative aspect-square w-full overflow-hidden bg-panel-2">
                  {producto.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={producto.imageUrl}
                      alt={producto.nombre}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-ink-soft">
                      Sin imagen
                    </div>
                  )}
                  {agotado && (
                    <span className="absolute right-1.5 top-1.5 rounded-md bg-red-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      Agotado
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="truncate text-[10px] font-medium uppercase tracking-wide text-ink-soft">
                    {producto.codigo}
                  </p>
                  <p className="truncate text-sm font-medium text-ink">
                    {producto.nombre}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gold">
                    {formatCurrency(producto.precio)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}
    </div>
  );
}
