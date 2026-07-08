"use client";

import { useEffect, useState } from "react";
import { subscribeCategorias } from "@/lib/db";
import type { Categoria } from "@/lib/types";

export function useCategories() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeCategorias((data) => {
      setCategorias(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { categorias, loading };
}
