"use client";

import { useMemo } from "react";
import { useSales, type RangoFechas } from "@/hooks/useSales";
import { useProducts } from "@/hooks/useProducts";
import { dateKey, formatDate } from "@/lib/utils";

export interface VentasPorDia {
  fecha: string;
  etiqueta: string;
  total: number;
}

export interface TopItem {
  nombre: string;
  cantidad: number;
  total: number;
}

export interface CategoriaVentas {
  categoria: string;
  total: number;
}

export function useReports(rango: RangoFechas) {
  const { ventas, stats, loading: loadingVentas } = useSales(rango);
  const { productos, loading: loadingProductos } = useProducts();

  const categoriaPorProducto = useMemo(() => {
    const map: Record<string, string> = {};
    productos.forEach((p) => {
      map[p.id] = p.categoria;
    });
    return map;
  }, [productos]);

  const ventasPorDia: VentasPorDia[] = useMemo(() => {
    const map = new Map<string, number>();
    ventas.forEach((venta) => {
      if (!venta.fecha) return;
      const key = dateKey(venta.fecha.toDate());
      map.set(key, (map.get(key) ?? 0) + venta.total);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, total]) => ({
        fecha,
        etiqueta: formatDate(new Date(fecha)),
        total,
      }));
  }, [ventas]);

  const topProductos: TopItem[] = useMemo(() => {
    const map = new Map<string, TopItem>();
    ventas.forEach((venta) => {
      venta.items.forEach((item) => {
        const key = item.nombre;
        const current = map.get(key) ?? { nombre: key, cantidad: 0, total: 0 };
        current.cantidad += item.cantidad;
        current.total += item.subtotal;
        map.set(key, current);
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }, [ventas]);

  const ventasPorCategoria: CategoriaVentas[] = useMemo(() => {
    const map = new Map<string, number>();
    ventas.forEach((venta) => {
      venta.items.forEach((item) => {
        const categoria = categoriaPorProducto[item.productoId] ?? "Otros";
        map.set(categoria, (map.get(categoria) ?? 0) + item.subtotal);
      });
    });
    return Array.from(map.entries())
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);
  }, [ventas, categoriaPorProducto]);

  return {
    ventas,
    stats,
    ventasPorDia,
    topProductos,
    ventasPorCategoria,
    loading: loadingVentas || loadingProductos,
  };
}
