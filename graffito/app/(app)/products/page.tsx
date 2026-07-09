"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import ProductGrid from "@/components/Products/ProductGrid";
import ComboGrid from "@/components/Products/ComboGrid";
import ProductModal from "@/components/Products/ProductModal";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import Loading from "@/components/Common/Loading";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useSettings } from "@/hooks/useSettings";
import { deleteProducto } from "@/lib/db";
import { cn, productosPorCodigo } from "@/lib/utils";
import type { Producto } from "@/lib/types";

type Tab = "productos" | "combos";

export default function ProductsPage() {
  const { productos, loading } = useProducts();
  const { categorias } = useCategories();
  const { configuracion } = useSettings();

  const [tab, setTab] = useState<Tab>("productos");
  const [search, setSearch] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [toDelete, setToDelete] = useState<Producto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const productosSimples = useMemo(
    () => productos.filter((p) => p.tipo !== "combo"),
    [productos]
  );
  const combos = useMemo(
    () => productos.filter((p) => p.tipo === "combo"),
    [productos]
  );
  const porCodigo = useMemo(() => productosPorCodigo(productos), [productos]);

  const filtered = useMemo(() => {
    const base = tab === "productos" ? productosSimples : combos;
    const term = search.trim().toLowerCase();
    return base.filter((p) => {
      const matchesTerm =
        !term ||
        p.nombre.toLowerCase().includes(term) ||
        p.codigo.toLowerCase().includes(term);
      const matchesCategoria =
        tab === "combos" ||
        categoriaFiltro === "Todas" ||
        p.categoria === categoriaFiltro;
      return matchesTerm && matchesCategoria;
    });
  }, [tab, productosSimples, combos, search, categoriaFiltro]);

  const combosQueUsan = useMemo(() => {
    if (!toDelete) return [];
    return productos.filter(
      (p) =>
        p.tipo === "combo" &&
        p.itemsBase?.some((base) => base.codigo === toDelete.codigo)
    );
  }, [productos, toDelete]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(producto: Producto) {
    setEditing(producto);
    setModalOpen(true);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    if (combosQueUsan.length > 0) {
      toast.error(
        `No puedes eliminar "${toDelete.nombre}": lo usan ${combosQueUsan
          .map((c) => c.codigo)
          .join(", ")}.`
      );
      setToDelete(null);
      return;
    }
    setDeleting(true);
    try {
      await deleteProducto(toDelete.codigo);
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
      <div className="flex gap-1.5 rounded-lg border border-panel-2 bg-panel p-1 w-fit">
        {(
          [
            { id: "productos" as const, label: "Productos" },
            { id: "combos" as const, label: "Combos" },
          ]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-all duration-300",
              tab === t.id
                ? "bg-accent text-canvas"
                : "text-ink-soft hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o código..."
              className="w-full rounded-lg border border-panel-2 bg-panel py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
            />
          </div>
          {tab === "productos" && (
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="rounded-lg border border-panel-2 bg-panel px-3 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
            >
              <option value="Todas">Todas las categorías</option>
              {categorias
                .filter((cat) => cat.nombre !== "Combos")
                .map((cat) => (
                  <option key={cat.id} value={cat.nombre}>
                    {cat.nombre}
                  </option>
                ))}
            </select>
          )}
        </div>

        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-canvas transition-all duration-300 hover:brightness-95"
        >
          <Plus className="h-4 w-4" />
          {tab === "productos" ? "Nuevo producto" : "Nuevo combo"}
        </button>
      </div>

      {loading ? (
        <Loading label="Cargando productos..." />
      ) : tab === "productos" ? (
        <ProductGrid productos={filtered} onEdit={openEdit} onDelete={setToDelete} />
      ) : (
        <ComboGrid
          combos={filtered}
          productosPorCodigo={porCodigo}
          onEdit={openEdit}
          onDelete={setToDelete}
        />
      )}

      {modalOpen && (
        <ProductModal
          producto={editing}
          categorias={categorias}
          productos={productos}
          stockMinimoGlobal={configuracion.stockMinimoGlobal}
          defaultEsCombo={tab === "combos"}
          onClose={() => setModalOpen(false)}
          onSaved={() => setModalOpen(false)}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar producto"
        message={
          combosQueUsan.length > 0
            ? `"${toDelete?.nombre}" es parte de ${combosQueUsan.length} combo(s) y no se puede eliminar hasta que se quiten de esos combos.`
            : toDelete && toDelete.stock > 0
              ? `"${toDelete.nombre}" todavía tiene ${toDelete.stock} unidades en stock. ¿Deseas eliminarlo de todas formas?`
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
