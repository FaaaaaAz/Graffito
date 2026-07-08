"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import ProductGrid from "@/components/Products/ProductGrid";
import ProductModal from "@/components/Products/ProductModal";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import Loading from "@/components/Common/Loading";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useSettings } from "@/hooks/useSettings";
import { deleteProducto } from "@/lib/db";
import { totalStock } from "@/lib/utils";
import type { ProductoConVariantes } from "@/lib/types";

export default function ProductsPage() {
  const { productos, loading } = useProducts();
  const { categorias } = useCategories();
  const { configuracion } = useSettings();

  const [search, setSearch] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductoConVariantes | null>(null);
  const [toDelete, setToDelete] = useState<ProductoConVariantes | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return productos.filter((p) => {
      const matchesTerm = !term || p.nombre.toLowerCase().includes(term);
      const matchesCategoria =
        categoriaFiltro === "Todas" || p.categoria === categoriaFiltro;
      return matchesTerm && matchesCategoria;
    });
  }, [productos, search, categoriaFiltro]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(producto: ProductoConVariantes) {
    setEditing(producto);
    setModalOpen(true);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteProducto(toDelete.id);
      toast.success("Producto eliminado");
      setToDelete(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo eliminar el producto"
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full rounded-lg border border-panel-2 bg-panel py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
            />
          </div>
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="rounded-lg border border-panel-2 bg-panel px-3 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
          >
            <option value="Todas">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.nombre}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-canvas transition-all duration-300 hover:brightness-95"
        >
          <Plus className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>

      {loading ? (
        <Loading label="Cargando productos..." />
      ) : (
        <ProductGrid
          productos={filtered}
          onEdit={openEdit}
          onDelete={setToDelete}
        />
      )}

      {modalOpen && (
        <ProductModal
          producto={editing}
          categorias={categorias}
          stockMinimoGlobal={configuracion.stockMinimoGlobal}
          onClose={() => setModalOpen(false)}
          onSaved={() => setModalOpen(false)}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar producto"
        message={
          toDelete && totalStock(toDelete.variantes) > 0
            ? `"${toDelete.nombre}" todavía tiene ${totalStock(toDelete.variantes)} unidades en stock. ¿Deseas eliminarlo de todas formas?`
            : `¿Deseas eliminar "${toDelete?.nombre}"? Esta acción no se puede deshacer.`
        }
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
