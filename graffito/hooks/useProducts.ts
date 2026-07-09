"use client";

import { useEffect, useState } from "react";
import { subscribeProductos } from "@/lib/db";
import type { Producto } from "@/lib/types";

export function useProducts() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeProductos((data) => {
      setProductos(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { productos, loading };
}
