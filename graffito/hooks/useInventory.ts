"use client";

import { useEffect, useMemo, useState } from "react";
import { subscribeMovimientos } from "@/lib/db";
import { useProducts } from "@/hooks/useProducts";
import type { MovimientoStock, Producto, Variante } from "@/lib/types";

export interface StockRow {
  producto: Producto;
  variante: Variante;
}

export function useInventory(movimientosLimit = 20) {
  const { productos, loading: loadingProductos } = useProducts();
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeMovimientos((data) => {
      setMovimientos(data);
      setLoadingMovimientos(false);
    }, movimientosLimit);
    return unsubscribe;
  }, [movimientosLimit]);

  const stockRows: StockRow[] = useMemo(
    () =>
      productos.flatMap((producto) =>
        producto.variantes.map((variante) => ({ producto, variante }))
      ),
    [productos]
  );

  return {
    stockRows,
    movimientos,
    loading: loadingProductos || loadingMovimientos,
  };
}
