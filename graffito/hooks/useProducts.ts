"use client";

import { useEffect, useMemo, useState } from "react";
import {
  subscribeProductos,
  subscribeVariantesGroup,
} from "@/lib/db";
import type { Producto, ProductoConVariantes, Variante } from "@/lib/types";

export function useProducts() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [variantesPorProducto, setVariantesPorProducto] = useState<
    Record<string, Variante[]>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let productosReady = false;
    let variantesReady = false;

    const checkReady = () => {
      if (productosReady && variantesReady) setLoading(false);
    };

    const unsubProductos = subscribeProductos((data) => {
      setProductos(data);
      productosReady = true;
      checkReady();
    });

    const unsubVariantes = subscribeVariantesGroup((data) => {
      setVariantesPorProducto(data);
      variantesReady = true;
      checkReady();
    });

    return () => {
      unsubProductos();
      unsubVariantes();
    };
  }, []);

  const productosConVariantes: ProductoConVariantes[] = useMemo(
    () =>
      productos.map((producto) => ({
        ...producto,
        variantes: (variantesPorProducto[producto.id] ?? []).sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        ),
      })),
    [productos, variantesPorProducto]
  );

  return { productos: productosConVariantes, loading };
}
