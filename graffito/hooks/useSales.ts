"use client";

import { useEffect, useMemo, useState } from "react";
import { subscribeVentasRango } from "@/lib/db";
import { computeVentasStats } from "@/lib/utils";
import type { Venta } from "@/lib/types";

export interface RangoFechas {
  inicio: Date;
  fin: Date;
}

export function useSales(rango: RangoFechas) {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);

  const inicioTime = rango.inicio.getTime();
  const finTime = rango.fin.getTime();

  useEffect(() => {
    const unsubscribe = subscribeVentasRango(
      new Date(inicioTime),
      new Date(finTime),
      (data) => {
        setVentas(data);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [inicioTime, finTime]);

  const stats = useMemo(() => computeVentasStats(ventas), [ventas]);

  return { ventas, stats, loading };
}
