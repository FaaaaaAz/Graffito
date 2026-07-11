"use client";

import { useEffect, useState } from "react";
import { subscribePackaging, subscribeVinculosPackaging } from "@/lib/db";
import type { ProductoPackaging, VinculoProductoPackaging } from "@/lib/types";

export function usePackaging() {
  const [packaging, setPackaging] = useState<ProductoPackaging[]>([]);
  const [vinculos, setVinculos] = useState<VinculoProductoPackaging[]>([]);
  const [loadingPackaging, setLoadingPackaging] = useState(true);
  const [loadingVinculos, setLoadingVinculos] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribePackaging((data) => {
      setPackaging(data);
      setLoadingPackaging(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeVinculosPackaging((data) => {
      setVinculos(data);
      setLoadingVinculos(false);
    });
    return unsubscribe;
  }, []);

  return {
    packaging,
    vinculos,
    loading: loadingPackaging || loadingVinculos,
  };
}
