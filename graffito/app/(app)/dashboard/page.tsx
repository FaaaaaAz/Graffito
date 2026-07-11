"use client";

import { useMemo } from "react";
import { AlertTriangle, DollarSign, Package, Receipt } from "lucide-react";
import StatCard from "@/components/Dashboard/StatCard";
import {
  CategoryDonutChart,
  SalesLineChart,
  TopProductsBarChart,
} from "@/components/Dashboard/Charts";
import {
  CriticalStockAlerts,
  RecentMovements,
  RecentSales,
} from "@/components/Dashboard/ActivityFeed";
import { useSales } from "@/hooks/useSales";
import { useReports } from "@/hooks/useReports";
import { useInventory } from "@/hooks/useInventory";
import { usePackaging } from "@/hooks/usePackaging";
import { construirAlertasStock, formatCurrency, truncateText } from "@/lib/utils";
import Loading from "@/components/Common/Loading";

function useDayRange() {
  return useMemo(() => {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 1);
    return { inicio, fin };
  }, []);
}

function useLast7DaysRange() {
  return useMemo(() => {
    const fin = new Date();
    fin.setHours(0, 0, 0, 0);
    fin.setDate(fin.getDate() + 1);
    const inicio = new Date(fin);
    inicio.setDate(inicio.getDate() - 7);
    return { inicio, fin };
  }, []);
}

export default function DashboardPage() {
  const hoy = useDayRange();
  const ultimos7Dias = useLast7DaysRange();

  const { ventas: ventasHoy, stats, loading: loadingHoy } = useSales(hoy);
  const {
    ventasPorDia,
    ventasPorCategoria,
    topProductos,
    loading: loadingReportes,
  } = useReports(ultimos7Dias);
  const { productos, movimientos, loading: loadingInventario } =
    useInventory(10);
  const { packaging, loading: loadingPackaging } = usePackaging();
  const productosSimples = productos.filter((p) => p.tipo !== "combo");

  const alertasStock = construirAlertasStock(productosSimples, packaging);

  const loading =
    loadingHoy || loadingReportes || loadingInventario || loadingPackaging;

  if (loading) return <Loading label="Cargando dashboard..." />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Receipt}
          label="Ventas del día"
          value={`${stats.numeroTransacciones}`}
          hint="Transacciones registradas"
          accent="accent"
        />
        <StatCard
          icon={DollarSign}
          label="Ingresos del día"
          value={formatCurrency(stats.totalVendido)}
          hint="Total en Bolivianos"
          accent="gold"
        />
        <StatCard
          icon={Package}
          label="Productos vendidos hoy"
          value={`${stats.cantidadProductos}`}
          hint="Unidades"
        />
        <StatCard
          icon={AlertTriangle}
          label="Stock con alerta"
          value={`${alertasStock.length}`}
          hint="Productos bajo el mínimo"
          accent={alertasStock.length > 0 ? "danger" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-panel-2 bg-panel p-5 shadow-sm xl:col-span-2">
          <h3 className="mb-2 text-sm font-semibold text-ink">
            Ventas de los últimos 7 días
          </h3>
          <SalesLineChart data={ventasPorDia} />
        </div>
        <div className="rounded-xl border border-panel-2 bg-panel p-5 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-ink">
            Ventas por categoría
          </h3>
          <CategoryDonutChart
            data={ventasPorCategoria.map((c) => ({
              categoria: c.categoria,
              total: c.total,
            }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-panel-2 bg-panel p-5 shadow-sm xl:col-span-1">
          <h3 className="mb-2 text-sm font-semibold text-ink">
            Top 5 productos más vendidos
          </h3>
          <TopProductsBarChart
            data={topProductos.map((p) => ({
              nombre: truncateText(p.nombre, 16),
              cantidad: p.cantidad,
            }))}
          />
        </div>
        <div className="xl:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RecentSales ventas={ventasHoy} />
          <RecentMovements movimientos={movimientos} />
        </div>
      </div>

      <CriticalStockAlerts alertas={alertasStock} />
    </div>
  );
}
