"use client";

import { useEffect, useState } from "react";
import { subscribeConfiguracion } from "@/lib/db";
import type { ConfiguracionGeneral } from "@/lib/types";

const DEFAULT_CONFIG: ConfiguracionGeneral = {
  nombreEmpresa: "Graffito",
  logoUrl: "",
  telefono: "",
  email: "",
  direccion: "",
  stockMinimoGlobal: 5,
};

export function useSettings() {
  const [configuracion, setConfiguracion] =
    useState<ConfiguracionGeneral>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeConfiguracion((data) => {
      setConfiguracion(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { configuracion, loading };
}
