"use client";

import { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import VariantManager, { type VariantDraft } from "./VariantManager";
import {
  addProducto,
  addVariante,
  deleteVariante,
  updateProducto,
  updateVariante,
} from "@/lib/db";
import type { Categoria, ProductoConVariantes } from "@/lib/types";

export default function ProductModal({
  producto,
  categorias,
  stockMinimoGlobal,
  onClose,
  onSaved,
}: {
  producto: ProductoConVariantes | null;
  categorias: Categoria[];
  stockMinimoGlobal: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = Boolean(producto);

  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [categoria, setCategoria] = useState(
    producto?.categoria ?? categorias[0]?.nombre ?? ""
  );
  const [precio, setPrecio] = useState(producto?.precio ?? 0);
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? "");
  const [imageUrl, setImageUrl] = useState(producto?.imageUrl ?? "");
  const [variantesDraft, setVariantesDraft] = useState<VariantDraft[]>(
    producto?.variantes.map((v) => ({
      id: v.id,
      nombre: v.nombre,
      stock: v.stock,
      stockMinimo: v.stockMinimo,
      imageUrl: v.imageUrl ?? "",
    })) ?? []
  );
  const [saving, setSaving] = useState(false);

  const categoriaEfectiva = categoria || categorias[0]?.nombre || "";

  async function handleSubmit() {
    if (!nombre.trim() || !categoriaEfectiva || precio <= 0) {
      toast.error("Completa nombre, categoría y un precio válido.");
      return;
    }

    setSaving(true);
    try {
      const data = {
        nombre: nombre.trim(),
        categoria: categoriaEfectiva,
        precio,
        descripcion,
        imageUrl,
      };

      if (!producto) {
        await addProducto(
          data,
          variantesDraft.map((v) => ({
            nombre: v.nombre.trim() || "Estándar",
            stock: v.stock,
            stockMinimo: v.stockMinimo,
            imageUrl: v.imageUrl,
          })),
          stockMinimoGlobal
        );
        toast.success("Producto creado correctamente");
      } else {
        await updateProducto(producto.id, data);

        const originalIds = producto.variantes.map((v) => v.id);
        const currentIds = variantesDraft
          .filter((v) => v.id)
          .map((v) => v.id as string);
        const removedIds = originalIds.filter((id) => !currentIds.includes(id));

        await Promise.all(
          removedIds.map((id) => deleteVariante(producto.id, id))
        );

        const finalDrafts =
          variantesDraft.length > 0
            ? variantesDraft
            : [
                {
                  nombre: "Estándar",
                  stock: 0,
                  stockMinimo: stockMinimoGlobal,
                  imageUrl: "",
                },
              ];

        await Promise.all(
          finalDrafts.map((draft) => {
            const payload = {
              nombre: draft.nombre.trim() || "Estándar",
              stock: draft.stock,
              stockMinimo: draft.stockMinimo,
              imageUrl: draft.imageUrl,
            };
            return draft.id
              ? updateVariante(producto.id, draft.id, payload)
              : addVariante(producto.id, payload);
          })
        );

        toast.success("Producto actualizado correctamente");
      }

      onSaved();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo guardar el producto"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm">
      <div className="flex max-h-full w-full max-w-2xl flex-col rounded-xl border border-panel-2 bg-panel shadow-md">
        <div className="flex items-center justify-between border-b border-panel-2 px-5 py-4">
          <h3 className="text-base font-semibold text-ink">
            {isEditing ? "Editar producto" : "Nuevo producto"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-soft hover:bg-panel-2 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">
                Nombre del producto
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Bolígrafo Parker"
                className="w-full rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">
                Categoría
              </label>
              <select
                value={categoriaEfectiva}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
              >
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.nombre}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">
                Precio base (Bs)
              </label>
              <input
                type="number"
                min={0}
                value={precio}
                onChange={(e) => setPrecio(Number(e.target.value))}
                className="w-full rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">
                Descripción
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">
                URL de imagen
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="border-t border-panel-2 pt-4">
            <VariantManager
              variantes={variantesDraft}
              onChange={setVariantesDraft}
              stockMinimoDefault={stockMinimoGlobal}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-panel-2 px-5 py-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-soft transition-all duration-300 hover:bg-panel-2 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-canvas transition-all duration-300 hover:brightness-95 disabled:opacity-60"
          >
            {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear producto"}
          </button>
        </div>
      </div>
    </div>
  );
}
