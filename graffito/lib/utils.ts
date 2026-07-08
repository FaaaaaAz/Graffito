import type { Timestamp } from "firebase/firestore";
import type { EstadoStock, Variante, Venta } from "./types";

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
      return "Bajo stock";
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

export function totalStock(variantes: Variante[]): number {
  return variantes.reduce((sum, v) => sum + v.stock, 0);
}

export function productStockStatus(variantes: Variante[]): EstadoStock {
  if (variantes.length === 0) return "agotado";
  const total = totalStock(variantes);
  if (total <= 0) return "agotado";
  const anyBajo = variantes.some(
    (v) => stockStatus(v.stock, v.stockMinimo) !== "en-stock"
  );
  return anyBajo ? "bajo" : "en-stock";
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
    "Producto",
    "Variante",
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
      rows.push(
        [
          fecha,
          venta.cliente ?? "",
          venta.metodoPago,
          item.nombreProducto,
          item.nombreVariante,
          item.cantidad,
          item.precioUnitario,
          item.grabado ? "Si" : "No",
          item.textoGrabado ?? "",
          (item.precioUnitario * item.cantidad).toFixed(2),
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
