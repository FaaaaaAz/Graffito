"use client";

import { useMemo, useState } from "react";
import { CreditCard, Package, Receipt, TrendingUp } from "lucide-react";
import StatCard from "@/components/Dashboard/StatCard";
import SalesTable from "@/components/Sales/SalesTable";
import CashierClosing from "@/components/Sales/CashierClosing";
import ExportButton from "@/components/Reports/ExportButton";
import Loading from "@/components/Common/Loading";
import { useSales } from "@/hooks/useSales";
import { computeVentasStats, dateKey, formatCurrency } from "@/lib/utils";
import type { MetodoPago } from "@/lib/types";

const METODOS: Array<MetodoPago | "Todos"> = [
  "Todos",
  "Efectivo",
  "Tarjeta",
  "Transferencia",
  "Otro",
];

export default function SalesPage() {
  const today = dateKey(new Date());
  const [fechaInicio, setFechaInicio] = useState(today);
  const [fechaFin, setFechaFin] = useState(today);
  const [metodoPago, setMetodoPago] = useState<MetodoPago | "Todos">("Todos");

  const rango = useMemo(() => {
    const inicio = new Date(`${fechaInicio}T00:00:00`);
    const fin = new Date(`${fechaFin}T00:00:00`);
    fin.setDate(fin.getDate() + 1);
    return { inicio, fin };
  }, [fechaInicio, fechaFin]);

  const { ventas, loading } = useSales(rango);

  const ventasFiltradas = useMemo(
    () =>
      metodoPago === "Todos"
        ? ventas
        : ventas.filter((v) => v.metodoPago === metodoPago),
    [ventas, metodoPago]
  );

  const stats = useMemo(
    () => computeVentasStats(ventasFiltradas),
    [ventasFiltradas]
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Total vendido"
          value={formatCurrency(stats.totalVendido)}
          accent="gold"
        />
        <StatCard
          icon={Package}
          label="Productos vendidos"
          value={`${stats.cantidadProductos}`}
        />
        <StatCard
          icon={Receipt}
          label="Transacciones"
          value={`${stats.numeroTransacciones}`}
          accent="accent"
        />
        <StatCard
          icon={CreditCard}
          label="Ticket promedio"
          value={formatCurrency(stats.ticketPromedio)}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-panel-2 bg-panel p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">
              Desde
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">
              Hasta
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">
              Método de pago
            </label>
            <select
              value={metodoPago}
              onChange={(e) =>
                setMetodoPago(e.target.value as MetodoPago | "Todos")
              }
              className="rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            >
              {METODOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <ExportButton
            ventas={ventasFiltradas}
            filename={`ventas_${fechaInicio}_a_${fechaFin}.csv`}
          />
          <CashierClosing stats={stats} />
        </div>
      </div>

      {loading ? (
        <Loading label="Cargando ventas..." />
      ) : (
        <SalesTable ventas={ventasFiltradas} />
      )}
    </div>
  );
}
