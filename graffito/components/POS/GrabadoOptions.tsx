"use client";

import { PenLine } from "lucide-react";
import type { CartItem, GrabadoInfo } from "@/lib/types";
import { cn, grabadoElegibilidad } from "@/lib/utils";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-panel-2 bg-panel p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <PenLine className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-ink">Grabado personalizado</h3>
      </div>
      {children}
    </div>
  );
}

function ProductSummary({ item }: { item: CartItem }) {
  return (
    <div className="mb-4 rounded-lg border border-panel-2 bg-canvas-soft p-3">
      <p className="truncate text-sm font-medium text-ink">{item.nombre}</p>
      <p className="text-xs text-ink-soft">
        {item.codigo}
        {item.cantidad > 1 && ` · ${item.cantidad} unidades`}
      </p>
    </div>
  );
}

const textareaClass =
  "w-full resize-none rounded-lg border border-panel-2 bg-canvas-soft p-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none";
const inputClass =
  "w-full rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none";

export default function GrabadoOptions({
  item,
  onChange,
}: {
  item: CartItem | null;
  onChange: (grabado: GrabadoInfo) => void;
}) {
  if (!item) {
    return (
      <Frame>
        <p className="py-10 text-center text-sm text-ink-soft">
          Selecciona un producto del carrito para agregar un grabado.
        </p>
      </Frame>
    );
  }

  const elegibilidad = grabadoElegibilidad(item);

  if (elegibilidad === "ninguno") {
    return (
      <Frame>
        <ProductSummary item={item} />
        <p className="text-sm text-ink-soft">
          Los productos de {item.categoria.toLowerCase()} no admiten grabado.
        </p>
      </Frame>
    );
  }

  if (elegibilidad === "combo") {
    const g = item.grabado.modo === "combo" ? item.grabado : null;
    const agendaChecked = g?.agenda !== undefined;
    const boligrafoChecked = g?.boligrafo !== undefined;

    function setCombo(patch: { agenda?: string; boligrafo?: string }) {
      const next = {
        agenda: "agenda" in patch ? patch.agenda : g?.agenda,
        boligrafo: "boligrafo" in patch ? patch.boligrafo : g?.boligrafo,
      };
      if (next.agenda === undefined && next.boligrafo === undefined) {
        onChange({ modo: "ninguno" });
      } else {
        onChange({ modo: "combo", ...next });
      }
    }

    return (
      <Frame>
        <ProductSummary item={item} />
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          <div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={agendaChecked}
                onChange={(e) =>
                  setCombo({ agenda: e.target.checked ? "" : undefined })
                }
                className="h-4 w-4 rounded border-panel-2 accent-[#F5C518]"
              />
              Grabado en la agenda
            </label>
            {agendaChecked && (
              <textarea
                value={g?.agenda ?? ""}
                onChange={(e) => setCombo({ agenda: e.target.value })}
                placeholder='Ej. "Para mi mamá"'
                rows={2}
                className={cn(textareaClass, "mt-2")}
              />
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={boligrafoChecked}
                onChange={(e) =>
                  setCombo({ boligrafo: e.target.checked ? "" : undefined })
                }
                className="h-4 w-4 rounded border-panel-2 accent-[#F5C518]"
              />
              Grabado en el bolígrafo
            </label>
            {boligrafoChecked && (
              <textarea
                value={g?.boligrafo ?? ""}
                onChange={(e) => setCombo({ boligrafo: e.target.value })}
                placeholder='Ej. "Con cariño"'
                rows={2}
                className={cn(textareaClass, "mt-2")}
              />
            )}
          </div>

          <p className="text-xs text-ink-soft">
            El grabado es solo informativo: no afecta el precio ni el stock.
          </p>
        </div>
      </Frame>
    );
  }

  // elegibilidad === "simple"
  const grabadoActual = item.grabado;
  const cantidadActual = item.cantidad;
  const checked = grabadoActual.modo !== "ninguno";

  function toggleChecked(next: boolean) {
    onChange(next ? { modo: "unico", texto: "" } : { modo: "ninguno" });
  }

  function setModo(modo: "unico" | "individual") {
    if (modo === "unico") {
      const texto =
        grabadoActual.modo === "individual"
          ? (grabadoActual.textos[0] ?? "")
          : grabadoActual.modo === "unico"
            ? grabadoActual.texto
            : "";
      onChange({ modo: "unico", texto });
    } else {
      const previo =
        grabadoActual.modo === "individual" ? grabadoActual.textos : [];
      const previoUnico = grabadoActual.modo === "unico" ? grabadoActual.texto : "";
      const textos = Array.from(
        { length: cantidadActual },
        (_, i) => previo[i] ?? (i === 0 ? previoUnico : "")
      );
      onChange({ modo: "individual", textos });
    }
  }

  return (
    <Frame>
      <ProductSummary item={item} />

      <label className="mb-3 flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => toggleChecked(e.target.checked)}
          className="h-4 w-4 rounded border-panel-2 accent-[#F5C518]"
        />
        ¿Incluye grabado?
      </label>

      {checked && item.cantidad === 1 && item.grabado.modo === "unico" && (
        <textarea
          value={item.grabado.texto}
          onChange={(e) => onChange({ modo: "unico", texto: e.target.value })}
          placeholder='Ej. "Feliz Día Papá"'
          rows={4}
          className={textareaClass}
          autoFocus
        />
      )}

      {checked && item.cantidad > 1 && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setModo("unico")}
              className={cn(
                "rounded-lg border px-2 py-2 text-xs font-medium transition-all duration-300",
                item.grabado.modo === "unico"
                  ? "border-accent bg-accent text-canvas"
                  : "border-panel-2 bg-canvas-soft text-ink-soft hover:text-ink"
              )}
            >
              Mismo para todos
            </button>
            <button
              type="button"
              onClick={() => setModo("individual")}
              className={cn(
                "rounded-lg border px-2 py-2 text-xs font-medium transition-all duration-300",
                item.grabado.modo === "individual"
                  ? "border-accent bg-accent text-canvas"
                  : "border-panel-2 bg-canvas-soft text-ink-soft hover:text-ink"
              )}
            >
              Diferente para cada uno
            </button>
          </div>

          {item.grabado.modo === "unico" && (
            <textarea
              value={item.grabado.texto}
              onChange={(e) => onChange({ modo: "unico", texto: e.target.value })}
              placeholder='Ej. "Feliz Día Papá"'
              rows={4}
              className={textareaClass}
            />
          )}

          {item.grabado.modo === "individual" && (
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {item.grabado.textos.map((texto, index) => (
                <div key={index}>
                  <label className="mb-1 block text-xs text-ink-soft">
                    Unidad {index + 1}
                  </label>
                  <input
                    type="text"
                    value={texto}
                    onChange={(e) => {
                      if (item.grabado.modo !== "individual") return;
                      const textos = [...item.grabado.textos];
                      textos[index] = e.target.value;
                      onChange({ modo: "individual", textos });
                    }}
                    placeholder={`Grabado para la unidad ${index + 1}`}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {checked && (
        <p className="mt-2 text-xs text-ink-soft">
          El grabado es solo informativo: no afecta el precio ni el stock.
        </p>
      )}
    </Frame>
  );
}
