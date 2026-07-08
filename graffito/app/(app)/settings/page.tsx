"use client";

import CompanyInfo from "@/components/Settings/CompanyInfo";
import CategoryManager from "@/components/Settings/CategoryManager";
import UserSettings from "@/components/Settings/UserSettings";
import Loading from "@/components/Common/Loading";
import { useSettings } from "@/hooks/useSettings";
import { useCategories } from "@/hooks/useCategories";

export default function SettingsPage() {
  const { configuracion, loading: loadingConfig } = useSettings();
  const { categorias, loading: loadingCategorias } = useCategories();

  if (loadingConfig || loadingCategorias) {
    return <Loading label="Cargando configuración..." />;
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <div className="space-y-5">
        <CompanyInfo configuracion={configuracion} />
        <CategoryManager categorias={categorias} />
      </div>
      <div>
        <UserSettings />
      </div>
    </div>
  );
}
