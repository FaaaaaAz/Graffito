import type { Timestamp } from "firebase/firestore";
import type {
  EstadoStock,
  GrabadoInfo,
  GrabadoTexto,
  Producto,
  ProductoPackaging,
  Tipografia,
  Venta,
  VinculoProductoPackaging,
} from "./types";

export type GrabadoElegibilidad = "ninguno" | "simple" | "combo";

/** Only refills are never engraved; combos get a dual agenda+pen engraving; everything else (including tomatodos) is simple. */
const CATEGORIAS_SIN_GRABADO = new Set(["Refills"]);

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

export function grabadoTextoVacio(tipografia: Tipografia = "Graffito"): GrabadoTexto {
  return { texto: "", tipografia };
}

const FONT_STACKS: Record<Tipografia, string> = {
  Graffito: "Georgia, 'Times New Roman', serif",
  Arial: "Arial, Helvetica, sans-serif",
  Courier: "'Courier New', Courier, monospace",
  "Comic Sans": "'Comic Sans MS', 'Comic Sans', cursive",
  "Times New Roman": "'Times New Roman', Times, serif",
  "Brush Script": "'Brush Script MT', 'Segoe Script', cursive",
};

export function tipografiaFontFamily(tipografia: Tipografia): string {
  return FONT_STACKS[tipografia];
}

export interface GrabadoLinea {
  label: string;
  value: string;
}

/** Structured lines for a receipt/summary; `[]` when there's nothing engraved. */
export function grabadoLineas(grabado: GrabadoInfo): GrabadoLinea[] {
  switch (grabado.modo) {
    case "ninguno":
      return [];
    case "unico":
      return [
        { label: "Grabado", value: grabado.texto || "-" },
        { label: "Tipografía", value: grabado.tipografia },
      ];
    case "individual":
      return grabado.unidades.flatMap((u, index) => [
        { label: `Grabado unidad ${index + 1}`, value: u.texto || "-" },
        { label: `Tipografía unidad ${index + 1}`, value: u.tipografia },
      ]);
    case "combo": {
      const lineas: GrabadoLinea[] = [];
      if (grabado.agenda) {
        lineas.push({ label: "Grabado agenda", value: grabado.agenda.texto || "-" });
        lineas.push({ label: "Tipografía agenda", value: grabado.agenda.tipografia });
      }
      if (grabado.boligrafo) {
        lineas.push({ label: "Grabado bolígrafo", value: grabado.boligrafo.texto || "-" });
        lineas.push({ label: "Tipografía bolígrafo", value: grabado.boligrafo.tipografia });
      }
      return lineas;
    }
  }
}

/** Keeps an "individual" engraving list in sync with a line's quantity. */
export function resizeGrabadoParaCantidad(
  grabado: GrabadoInfo,
  cantidad: number
): GrabadoInfo {
  if (grabado.modo !== "individual") return grabado;
  const unidades = grabado.unidades.slice(0, cantidad);
  while (unidades.length < cantidad) unidades.push(grabadoTextoVacio());
  return { modo: "individual", unidades };
}

/**
 * Defense-in-depth for the Firestore write boundary: Firestore rejects any
 * field whose value is `undefined` (this is exactly what caused the combo
 * engraving bug). The `GrabadoInfo` type no longer allows `undefined` to be
 * constructed, but this recursively strips it anyway in case a caller builds
 * a malformed object some other way.
 */
export function sanitizeForFirestore<T>(value: T): T {
  if (value === undefined) return null as T;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirestore(item)) as T;
  }
  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = val === undefined ? null : sanitizeForFirestore(val);
    }
    return out as T;
  }
  return value;
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

export function packagingPorId(
  packaging: ProductoPackaging[]
): Map<string, ProductoPackaging> {
  return new Map(packaging.map((p) => [p.id, p]));
}

export function vinculosPorProducto(
  vinculos: VinculoProductoPackaging[]
): Map<string, VinculoProductoPackaging> {
  return new Map(vinculos.map((v) => [v.productoId, v]));
}

export function packagingCategoriaLabel(
  categoria: ProductoPackaging["categoria"]
): string {
  return categoria === "bag" ? "Bolsa" : "Caja";
}

/** Unified stock-alert shape shared by products and packaging (see Dashboard). */
export interface AlertaStock {
  id: string;
  nombre: string;
  codigo: string;
  stock: number;
  stockMinimo: number;
  tipo: "producto" | "packaging";
}

export function construirAlertasStock(
  productos: Producto[],
  packaging: ProductoPackaging[]
): AlertaStock[] {
  const deProductos: AlertaStock[] = productos
    .filter((p) => stockStatus(p.stock, p.stockMinimo) !== "en-stock")
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      codigo: p.codigo,
      stock: p.stock,
      stockMinimo: p.stockMinimo,
      tipo: "producto",
    }));
  const dePackaging: AlertaStock[] = packaging
    .filter((p) => stockStatus(p.stock, p.stockMinimo) !== "en-stock")
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      codigo: p.codigo,
      stock: p.stock,
      stockMinimo: p.stockMinimo,
      tipo: "packaging",
    }));

  return [...deProductos, ...dePackaging].sort((a, b) => {
    const agotadoA = a.stock <= 0;
    const agotadoB = b.stock <= 0;
    if (agotadoA !== agotadoB) return agotadoA ? -1 : 1;
    return a.stock - b.stock;
  });
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
    "Celular",
    "Metodo de pago",
    "Codigo",
    "Producto",
    "Cantidad",
    "Precio unitario",
    "Grabado",
    "Total linea",
  ];
  const rows = [header.map(csvCell).join(",")];

  ventas.forEach((venta) => {
    const fecha = venta.fecha ? formatDateTime(venta.fecha) : "";
    venta.items.forEach((item) => {
      const lineas = grabadoLineas(item.grabado);
      const grabadoResumen = lineas.map((l) => `${l.label}: ${l.value}`).join(" | ");
      rows.push(
        [
          fecha,
          venta.cliente ?? "",
          venta.celular ?? "",
          venta.metodoPago,
          item.codigo,
          item.nombre,
          item.cantidad,
          item.precioUnitario,
          grabadoResumen,
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
