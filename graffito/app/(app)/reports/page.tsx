"use client";

import { useMemo, useState } from "react";
import { DollarSign, Package, Receipt } from "lucide-react";
import StatCard from "@/components/Dashboard/StatCard";
import ReportFilters, {
  rangoFromPreset,
  type PresetRango,
} from "@/components/Reports/ReportFilters";
import ReportCharts from "@/components/Reports/ReportCharts";
import ExportButton from "@/components/Reports/ExportButton";
import SalesTable from "@/components/Sales/SalesTable";
import Loading from "@/components/Common/Loading";
import { useReports } from "@/hooks/useReports";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage() {
  const [preset, setPreset] = useState<PresetRango>("7dias");
  const [customRange, setCustomRange] = useState(rangoFromPreset("7dias"));

  const { fechaInicio, fechaFin } =
    preset === "personalizado" ? customRange : rangoFromPreset(preset);

  const rango = useMemo(() => {
    const inicio = new Date(`${fechaInicio}T00:00:00`);
    const fin = new Date(`${fechaFin}T00:00:00`);
    fin.setDate(fin.getDate() + 1);
    return { inicio, fin };
  }, [fechaInicio, fechaFin]);

  const {
    ventas,
    stats,
    ventasPorDia,
    ventasPorCategoria,
    topProductos,
    loading,
  } = useReports(rango);

  return (
    <div className="space-y-5">
      <ReportFilters
        preset={preset}
        fechaInicio={customRange.fechaInicio}
        fechaFin={customRange.fechaFin}
        onPresetChange={(p) => {
          setPreset(p);
          if (p !== "personalizado") setCustomRange(rangoFromPreset(p));
        }}
        onCustomChange={(inicio, fin) =>
          setCustomRange({ fechaInicio: inicio, fechaFin: fin })
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={DollarSign}
          label="Ingresos totales"
          value={formatCurrency(stats.totalVendido)}
          accent="gold"
        />
        <StatCard
          icon={Receipt}
          label="Transacciones"
          value={`${stats.numeroTransacciones}`}
          accent="accent"
        />
        <StatCard
          icon={Package}
          label="Productos vendidos"
          value={`${stats.cantidadProductos}`}
        />
      </div>

      {loading ? (
        <Loading label="Cargando reportes..." />
      ) : (
        <>
          <ReportCharts
            ventasPorDia={ventasPorDia}
            ventasPorCategoria={ventasPorCategoria}
            topProductos={topProductos}
          />

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">
              Detalle de ventas del período
            </h3>
            <ExportButton
              ventas={ventas}
              filename={`reporte_${fechaInicio}_a_${fechaFin}.csv`}
            />
          </div>
          <SalesTable ventas={ventas} />
        </>
      )}
    </div>
  );
}
