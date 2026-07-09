"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { addProducto, updateProducto } from "@/lib/db";
import type { Categoria, ItemBaseCombo, Producto } from "@/lib/types";

export default function ProductModal({
  producto,
  categorias,
  productos,
  stockMinimoGlobal,
  defaultEsCombo = false,
  onClose,
  onSaved,
}: {
  producto: Producto | null;
  categorias: Categoria[];
  productos: Producto[];
  stockMinimoGlobal: number;
  defaultEsCombo?: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = Boolean(producto);
  /** Once a combo exists, its agenda+pen components are fixed — only price/stock stay editable. */
  const comboLocked = isEditing && producto?.tipo === "combo";

  const [codigo, setCodigo] = useState(producto?.codigo ?? "");
  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [categoria, setCategoria] = useState(
    producto?.categoria ?? categorias[0]?.nombre ?? ""
  );
  const [precio, setPrecio] = useState(producto?.precio ?? 0);
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? "");
  const [stock, setStock] = useState(producto?.stock ?? 0);
  const [stockMinimo, setStockMinimo] = useState(
    producto?.stockMinimo ?? stockMinimoGlobal
  );
  const [esCombo, setEsCombo] = useState(
    producto ? producto.tipo === "combo" : defaultEsCombo
  );
  const [comboAgenda, setComboAgenda] = useState(
    producto?.itemsBase?.find((i) => i.tipoProducto === "agenda")?.codigo ?? ""
  );
  const [comboMuller, setComboMuller] = useState(
    producto?.itemsBase?.find((i) => i.tipoProducto === "muller")?.codigo ?? ""
  );
  const [saving, setSaving] = useState(false);

  const agendas = useMemo(
    () => productos.filter((p) => p.categoria === "Agendas"),
    [productos]
  );
  const mullers = useMemo(
    () => productos.filter((p) => p.categoria === "Muller"),
    [productos]
  );

  const categoriaEfectiva = esCombo
    ? "Combos"
    : categoria || categorias[0]?.nombre || "";

  function handleEsComboChange(checked: boolean) {
    setEsCombo(checked);
    if (checked) {
      const agendaSel = agendas.find((a) => a.codigo === comboAgenda) ?? agendas[0];
      const mullerSel = mullers.find((m) => m.codigo === comboMuller) ?? mullers[0];
      if (agendaSel) setComboAgenda(agendaSel.codigo);
      if (mullerSel) setComboMuller(mullerSel.codigo);
      if (agendaSel && mullerSel) {
        setPrecio(agendaSel.precio + mullerSel.precio - 10);
      }
    }
  }

  function handleComboSelection(tipo: "agenda" | "muller", codigoSel: string) {
    if (tipo === "agenda") setComboAgenda(codigoSel);
    else setComboMuller(codigoSel);

    const agendaCodigo = tipo === "agenda" ? codigoSel : comboAgenda;
    const mullerCodigo = tipo === "muller" ? codigoSel : comboMuller;
    const agendaSel = agendas.find((a) => a.codigo === agendaCodigo);
    const mullerSel = mullers.find((m) => m.codigo === mullerCodigo);
    if (agendaSel && mullerSel) {
      setPrecio(agendaSel.precio + mullerSel.precio - 10);
    }
  }

  async function handleSubmit() {
    if (!codigo.trim() || !nombre.trim() || !categoriaEfectiva || precio <= 0) {
      toast.error("Completa código, nombre, categoría y un precio válido.");
      return;
    }
    if (esCombo && (!comboAgenda || !comboMuller)) {
      toast.error("Selecciona la agenda y el bolígrafo que forman el combo.");
      return;
    }

    setSaving(true);
    try {
      const itemsBase: ItemBaseCombo[] | undefined = esCombo
        ? [
            { tipoProducto: "agenda", codigo: comboAgenda, cantidad: 1 },
            { tipoProducto: "muller", codigo: comboMuller, cantidad: 1 },
          ]
        : undefined;

      const data = {
        codigo: codigo.trim().toUpperCase(),
        nombre: nombre.trim(),
        categoria: categoriaEfectiva,
        precio,
        descripcion,
        imageUrl: producto?.imageUrl ?? "",
        stock,
        stockMinimo,
        ...(esCombo ? { tipo: "combo" as const, itemsBase } : {}),
      };

      if (!producto) {
        await addProducto(data);
        toast.success("Producto creado correctamente");
      } else {
        await updateProducto(producto.codigo, data);
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
      <div className="flex max-h-full w-full max-w-lg flex-col rounded-xl border border-panel-2 bg-panel shadow-md">
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
          <label className="flex items-center gap-2 rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={esCombo}
              disabled={comboLocked}
              onChange={(e) => handleEsComboChange(e.target.checked)}
              className="h-4 w-4 rounded border-panel-2 accent-[#F5C518] disabled:opacity-60"
            />
            Es un combo (Agenda + Bolígrafo)
          </label>

          {esCombo && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-soft">
                  Agenda
                </label>
                <select
                  value={comboAgenda}
                  disabled={comboLocked}
                  onChange={(e) => handleComboSelection("agenda", e.target.value)}
                  className="w-full rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none disabled:opacity-60"
                >
                  {agendas.map((a) => (
                    <option key={a.codigo} value={a.codigo}>
                      {a.nombre} ({a.codigo})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-soft">
                  Bolígrafo Muller
                </label>
                <select
                  value={comboMuller}
                  disabled={comboLocked}
                  onChange={(e) => handleComboSelection("muller", e.target.value)}
                  className="w-full rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none disabled:opacity-60"
                >
                  {mullers.map((m) => (
                    <option key={m.codigo} value={m.codigo}>
                      {m.nombre} ({m.codigo})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-ink-soft sm:col-span-2">
                {comboLocked
                  ? "Los componentes de un combo ya creado no se pueden cambiar. Solo el precio y el stock del combo son editables."
                  : "El precio se sugiere automáticamente (Agenda + Bolígrafo − 10 Bs) y puede ajustarse abajo. Al vender, el stock de ambos productos base se descuenta atómicamente."}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">
                Código
              </label>
              <input
                type="text"
                value={codigo}
                disabled={isEditing}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ej. MOODNE"
                className="w-full rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none disabled:opacity-60"
              />
            </div>

            {!esCombo && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-soft">
                  Categoría
                </label>
                <select
                  value={categoriaEfectiva}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                >
                  {categorias
                    .filter((c) => c.nombre !== "Combos")
                    .map((cat) => (
                      <option key={cat.id} value={cat.nombre}>
                        {cat.nombre}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">
                Nombre del producto
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Tomatodo Negro"
                className="w-full rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">
                Precio (Bs)
              </label>
              <input
                type="number"
                min={0}
                value={precio}
                onChange={(e) => setPrecio(Number(e.target.value))}
                className="w-full rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">
                Stock {esCombo && "(contador propio del combo)"}
              </label>
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">
                Stock mínimo
              </label>
              <input
                type="number"
                min={0}
                value={stockMinimo}
                onChange={(e) => setStockMinimo(Number(e.target.value))}
                className="w-full rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">
                Descripción (opcional)
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
              />
            </div>
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
