"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, X, Check } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { addCategoria, deleteCategoria, updateCategoria } from "@/lib/db";
import type { Categoria } from "@/lib/types";

export default function CategoryManager({
  categorias,
}: {
  categorias: Categoria[];
}) {
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [toDelete, setToDelete] = useState<Categoria | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleAdd() {
    const nombre = nuevaCategoria.trim();
    if (!nombre) return;
    setAdding(true);
    try {
      await addCategoria(nombre, categorias.length);
      setNuevaCategoria("");
      toast.success("Categoría agregada");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo agregar la categoría"
      );
    } finally {
      setAdding(false);
    }
  }

  function startEdit(categoria: Categoria) {
    setEditingId(categoria.id);
    setEditingValue(categoria.nombre);
  }

  async function saveEdit(id: string) {
    const nombre = editingValue.trim();
    if (!nombre) return;
    try {
      await updateCategoria(id, { nombre });
      setEditingId(null);
      toast.success("Categoría actualizada");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo actualizar la categoría"
      );
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteCategoria(toDelete.id);
      toast.success("Categoría eliminada");
      setToDelete(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo eliminar la categoría"
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-xl border border-panel-2 bg-panel p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-ink">
        Categorías de productos
      </h3>

      <ul className="space-y-2">
        {categorias.map((categoria) => (
          <li
            key={categoria.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2"
          >
            {editingId === categoria.id ? (
              <input
                type="text"
                autoFocus
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit(categoria.id)}
                className="flex-1 rounded-md border border-panel-2 bg-panel px-2 py-1 text-sm text-ink focus:border-accent focus:outline-none"
              />
            ) : (
              <span className="text-sm text-ink">{categoria.nombre}</span>
            )}

            <div className="flex shrink-0 gap-1.5">
              {editingId === categoria.id ? (
                <>
                  <button
                    onClick={() => saveEdit(categoria.id)}
                    className="rounded-md p-1.5 text-emerald-400 hover:bg-panel-2"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-md p-1.5 text-ink-soft hover:bg-panel-2"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startEdit(categoria)}
                    className="rounded-md p-1.5 text-ink-soft hover:bg-panel-2 hover:text-ink"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setToDelete(categoria)}
                    className="rounded-md p-1.5 text-ink-soft hover:bg-panel-2 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={nuevaCategoria}
          onChange={(e) => setNuevaCategoria(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Nueva categoría"
          className="flex-1 rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !nuevaCategoria.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-canvas transition-all duration-300 hover:brightness-95 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar categoría"
        message={`¿Deseas eliminar "${toDelete?.nombre}"? Los productos existentes conservarán el nombre de categoría actual.`}
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
