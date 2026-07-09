"use client";

import { useEffect, useState } from "react";
import { subscribeMovimientos } from "@/lib/db";
import { useProducts } from "@/hooks/useProducts";
import type { MovimientoStock } from "@/lib/types";

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

  return {
    productos,
    movimientos,
    loading: loadingProductos || loadingMovimientos,
  };
}
