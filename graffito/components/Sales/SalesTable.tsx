"use client";

import { Fragment, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Venta } from "@/lib/types";
import { cn, formatCurrency, formatDateTime, grabadoLineas } from "@/lib/utils";

export default function SalesTable({ ventas }: { ventas: Venta[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (ventas.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-ink-soft">
        No hay ventas registradas en este período.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-panel-2 bg-panel shadow-sm">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr className="border-b border-panel-2 text-xs uppercase tracking-wide text-ink-soft">
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium">Productos</th>
            <th className="px-4 py-3 font-medium">Cantidad</th>
            <th className="px-4 py-3 font-medium">Método de pago</th>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Celular</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
            <th className="w-10 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {ventas.map((venta) => {
            const expanded = expandedId === venta.id;
            const cantidadTotal = venta.items.reduce((s, i) => s + i.cantidad, 0);
            return (
              <Fragment key={venta.id}>
                <tr
                  onClick={() => setExpandedId(expanded ? null : venta.id)}
                  className="cursor-pointer border-b border-panel-2 transition-colors duration-300 last:border-0 hover:bg-canvas-soft"
                >
                  <td className="px-4 py-3 text-ink-soft">
                    {formatDateTime(venta.fecha)}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-ink">
                    {venta.items.map((i) => i.nombre).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-ink">{cantidadTotal}</td>
                  <td className="px-4 py-3 text-ink-soft">{venta.metodoPago}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {venta.cliente || "-"}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {venta.celular || "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gold">
                    {formatCurrency(venta.total)}
                  </td>
                  <td className="px-4 py-3">
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-ink-soft transition-transform duration-300",
                        expanded && "rotate-180"
                      )}
                    />
                  </td>
                </tr>
                {expanded && (
                  <tr className="border-b border-panel-2 bg-canvas-soft last:border-0">
                    <td colSpan={8} className="px-4 py-3">
                      <ul className="space-y-3">
                        {venta.items.map((item, index) => {
                          const lineas = grabadoLineas(item.grabado);
                          return (
                            <li
                              key={index}
                              className="flex flex-wrap items-start justify-between gap-2 text-xs"
                            >
                              <div>
                                <p className="text-ink">
                                  {item.cantidad}x {item.nombre} ({item.codigo})
                                </p>
                                {lineas.map((linea, i) => (
                                  <p key={i} className="mt-0.5 text-ink-soft">
                                    {linea.label}: &ldquo;{linea.value}&rdquo;
                                  </p>
                                ))}
                              </div>
                              <span className="font-medium text-ink-soft">
                                {formatCurrency(item.subtotal)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
