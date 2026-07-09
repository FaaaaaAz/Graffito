import type { Timestamp } from "firebase/firestore";
import type { EstadoStock, GrabadoInfo, Producto, Venta } from "./types";

export type GrabadoElegibilidad = "ninguno" | "simple" | "combo";

/** Tomatodos and refills are never engraved; combos get a dual agenda+pen engraving; everything else is simple. */
const CATEGORIAS_SIN_GRABADO = new Set(["Tomatodos", "Refills"]);

export function grabadoElegibilidad(producto: {
  categoria: string;
  tipo?: "combo";
}): GrabadoElegibilidad {
  if (producto.tipo === "combo") return "combo";
  if (CATEGORIAS_SIN_GRABADO.has(producto.categoria)) return "ninguno";
  return "simple";
}

export function tieneGrabado(grabado: GrabadoInfo): boolean {
  return grabado.modo !== "ninguno";
}

/** Human-readable one-liner for a receipt/summary; `null` when there's nothing to show. */
export function describirGrabado(grabado: GrabadoInfo): string | null {
  switch (grabado.modo) {
    case "ninguno":
      return null;
    case "unico":
      return `Grabado: "${grabado.texto || "-"}"`;
    case "individual":
      return `Grabados: ${grabado.textos
        .map((texto, index) => `${index + 1}) "${texto || "-"}"`)
        .join(", ")}`;
    case "combo": {
      const partes: string[] = [];
      if (grabado.agenda !== undefined) partes.push(`Agenda: "${grabado.agenda || "-"}"`);
      if (grabado.boligrafo !== undefined)
        partes.push(`Bolígrafo: "${grabado.boligrafo || "-"}"`);
      return partes.length > 0 ? partes.join(" · ") : null;
    }
  }
}

/** Keeps an "individual" engraving list in sync with a line's quantity. */
export function resizeGrabadoParaCantidad(
  grabado: GrabadoInfo,
  cantidad: number
): GrabadoInfo {
  if (grabado.modo !== "individual") return grabado;
  const textos = grabado.textos.slice(0, cantidad);
  while (textos.length < cantidad) textos.push("");
  return { modo: "individual", textos };
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

export function productosPorCodigo(productos: Producto[]): Map<string, Producto> {
  return new Map(productos.map((p) => [p.codigo, p]));
}

/**
 * A combo's own `stock` field is a separate manual counter (see lib/db.ts) —
 * what actually gates whether it can be sold is the stock of its base
 * products (agenda + pen), since selling a combo only decrements those.
 */
export function stockDisponible(
  producto: Producto,
  porCodigo: Map<string, Producto>
): number {
  if (producto.tipo !== "combo" || !producto.itemsBase?.length) {
    return producto.stock;
  }
  return Math.min(
    ...producto.itemsBase.map((base) => {
      const stockBase = porCodigo.get(base.codigo)?.stock ?? 0;
      return Math.floor(stockBase / base.cantidad);
    })
  );
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(value: number): string {
  return `Bs ${value.toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value: Timestamp | Date | null | undefined): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : value.toDate();
  return date.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(
  value: Timestamp | Date | null | undefined
): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : value.toDate();
  return date.toLocaleString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(value: Timestamp | Date | null | undefined): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : value.toDate();
  return date.toLocaleTimeString("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function stockStatus(
  stock: number,
  stockMinimo: number
): EstadoStock {
  if (stock <= 0) return "agotado";
  if (stock <= stockMinimo) return "bajo";
  return "en-stock";
}

export function stockStatusLabel(status: EstadoStock): string {
  switch (status) {
    case "en-stock":
      return "En stock";
    case "bajo":
      return "Crítico";
    case "agotado":
      return "Agotado";
  }
}

export function stockStatusClasses(status: EstadoStock): string {
  switch (status) {
    case "en-stock":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "bajo":
      return "bg-[#F5C518]/15 text-[#F5C518] border-[#F5C518]/30";
    case "agotado":
      return "bg-red-500/15 text-red-400 border-red-500/30";
  }
}

export function computeVentasStats(ventas: Venta[]) {
  const totalVendido = ventas.reduce((sum, v) => sum + v.total, 0);
  const cantidadProductos = ventas.reduce(
    (sum, v) => sum + v.items.reduce((s, i) => s + i.cantidad, 0),
    0
  );
  const numeroTransacciones = ventas.length;
  const ticketPromedio =
    numeroTransacciones > 0 ? totalVendido / numeroTransacciones : 0;

  return { totalVendido, cantidadProductos, numeroTransacciones, ticketPromedio };
}

function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function ventasToCSV(ventas: Venta[]): string {
  const header = [
    "Fecha",
    "Cliente",
    "Metodo de pago",
    "Codigo",
    "Producto",
    "Cantidad",
    "Precio unitario",
    "Grabado",
    "Texto grabado",
    "Total linea",
  ];
  const rows = [header.map(csvCell).join(",")];

  ventas.forEach((venta) => {
    const fecha = venta.fecha ? formatDateTime(venta.fecha) : "";
    venta.items.forEach((item) => {
      const grabadoTexto = describirGrabado(item.grabado);
      rows.push(
        [
          fecha,
          venta.cliente ?? "",
          venta.metodoPago,
          item.codigo,
          item.nombre,
          item.cantidad,
          item.precioUnitario,
          grabadoTexto ? "Si" : "No",
          grabadoTexto ?? "",
          item.subtotal.toFixed(2),
        ]
          .map(csvCell)
          .join(",")
      );
    });
  });

  return rows.join("\n");
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([`﻿${content}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
