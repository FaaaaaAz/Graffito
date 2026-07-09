"use client";

import { PenLine } from "lucide-react";
import type { CartItem, GrabadoInfo, GrabadoTexto, Tipografia } from "@/lib/types";
import { TIPOGRAFIAS } from "@/lib/types";
import { cn, grabadoElegibilidad, grabadoTextoVacio, tipografiaFontFamily } from "@/lib/utils";

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

function TipografiaSelect({
  value,
  onChange,
}: {
  value: Tipografia;
  onChange: (tipografia: Tipografia) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Tipografia)}
      className="w-full rounded-lg border border-gold/40 bg-canvas-soft px-3 py-2 text-sm font-medium text-gold focus:border-gold focus:outline-none"
    >
      {TIPOGRAFIAS.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}

function GrabadoTextoEditor({
  value,
  onChange,
  placeholder,
  rows = 3,
  label,
  autoFocus,
}: {
  value: GrabadoTexto;
  onChange: (value: GrabadoTexto) => void;
  placeholder: string;
  rows?: number;
  label?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-medium text-ink-soft">{label}</p>}
      <textarea
        value={value.texto}
        onChange={(e) => onChange({ ...value, texto: e.target.value })}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        className={textareaClass}
      />
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">
          Tipografía
        </label>
        <TipografiaSelect
          value={value.tipografia}
          onChange={(tipografia) => onChange({ ...value, tipografia })}
        />
      </div>
      {value.texto.trim() && (
        <p
          className="truncate rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-gold"
          style={{ fontFamily: tipografiaFontFamily(value.tipografia) }}
        >
          {value.texto}
        </p>
      )}
    </div>
  );
}

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
    const agendaValue = g?.agenda ?? null;
    const boligrafoValue = g?.boligrafo ?? null;

    function setCombo(next: {
      agenda: GrabadoTexto | null;
      boligrafo: GrabadoTexto | null;
    }) {
      if (next.agenda === null && next.boligrafo === null) {
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
                checked={agendaValue !== null}
                onChange={(e) =>
                  setCombo({
                    agenda: e.target.checked ? grabadoTextoVacio() : null,
                    boligrafo: boligrafoValue,
                  })
                }
                className="h-4 w-4 rounded border-panel-2 accent-[#F5C518]"
              />
              Grabado en la agenda
            </label>
            {agendaValue && (
              <div className="mt-2">
                <GrabadoTextoEditor
                  value={agendaValue}
                  onChange={(agenda) => setCombo({ agenda, boligrafo: boligrafoValue })}
                  placeholder='Ej. "Para mi mamá"'
                  rows={2}
                />
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={boligrafoValue !== null}
                onChange={(e) =>
                  setCombo({
                    agenda: agendaValue,
                    boligrafo: e.target.checked ? grabadoTextoVacio() : null,
                  })
                }
                className="h-4 w-4 rounded border-panel-2 accent-[#F5C518]"
              />
              Grabado en el bolígrafo
            </label>
            {boligrafoValue && (
              <div className="mt-2">
                <GrabadoTextoEditor
                  value={boligrafoValue}
                  onChange={(boligrafo) => setCombo({ agenda: agendaValue, boligrafo })}
                  placeholder='Ej. "Con cariño"'
                  rows={2}
                />
              </div>
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
    onChange(next ? { modo: "unico", ...grabadoTextoVacio() } : { modo: "ninguno" });
  }

  function setModo(modo: "unico" | "individual") {
    if (modo === "unico") {
      const base: GrabadoTexto =
        grabadoActual.modo === "individual"
          ? (grabadoActual.unidades[0] ?? grabadoTextoVacio())
          : grabadoActual.modo === "unico"
            ? { texto: grabadoActual.texto, tipografia: grabadoActual.tipografia }
            : grabadoTextoVacio();
      onChange({ modo: "unico", ...base });
    } else {
      const previo = grabadoActual.modo === "individual" ? grabadoActual.unidades : [];
      const previoUnico: GrabadoTexto =
        grabadoActual.modo === "unico"
          ? { texto: grabadoActual.texto, tipografia: grabadoActual.tipografia }
          : grabadoTextoVacio();
      const unidades = Array.from(
        { length: cantidadActual },
        (_, i) => previo[i] ?? (i === 0 ? previoUnico : grabadoTextoVacio())
      );
      onChange({ modo: "individual", unidades });
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
        <GrabadoTextoEditor
          value={{ texto: item.grabado.texto, tipografia: item.grabado.tipografia }}
          onChange={(v) => onChange({ modo: "unico", ...v })}
          placeholder='Ej. "Feliz Día Papá"'
          rows={4}
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
            <GrabadoTextoEditor
              value={{ texto: item.grabado.texto, tipografia: item.grabado.tipografia }}
              onChange={(v) => onChange({ modo: "unico", ...v })}
              placeholder='Ej. "Feliz Día Papá"'
              rows={4}
            />
          )}

          {item.grabado.modo === "individual" && (
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {item.grabado.unidades.map((unidad, index) => (
                <GrabadoTextoEditor
                  key={index}
                  label={`Unidad ${index + 1}`}
                  value={unidad}
                  onChange={(v) => {
                    if (item.grabado.modo !== "individual") return;
                    const unidades = [...item.grabado.unidades];
                    unidades[index] = v;
                    onChange({ modo: "individual", unidades });
                  }}
                  placeholder={`Grabado para la unidad ${index + 1}`}
                  rows={2}
                />
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
