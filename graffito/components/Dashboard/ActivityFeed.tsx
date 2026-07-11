import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronRight,
  Receipt,
} from "lucide-react";
import type { MovimientoStock, Venta } from "@/lib/types";
import { formatCurrency, formatTime, type AlertaStock } from "@/lib/utils";

const LIMITE = 5;

function Panel({
  title,
  verMasHref,
  mostrarVerMas,
  children,
}: {
  title: string;
  verMasHref?: string;
  mostrarVerMas?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-panel-2 bg-panel p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-ink">{title}</h3>
      {children}
      {mostrarVerMas && verMasHref && (
        <Link
          href={verMasHref}
          className="mt-4 flex items-center justify-center gap-1 rounded-lg border border-panel-2 py-2 text-xs font-medium text-gold transition-all duration-300 hover:border-gold/40 hover:bg-gold/5"
        >
          Ver más
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="py-6 text-center text-sm text-ink-soft">{label}</p>;
}

export function RecentSales({ ventas }: { ventas: Venta[] }) {
  const items = ventas.slice(0, LIMITE);
  return (
    <Panel
      title="Últimas ventas"
      verMasHref="/sales"
      mostrarVerMas={ventas.length > LIMITE}
    >
      {items.length === 0 ? (
        <Empty label="Aún no hay ventas registradas hoy." />
      ) : (
        <ul className="space-y-3">
          {items.map((venta) => (
            <li key={venta.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="rounded-full bg-panel-2 p-1.5">
                  <Receipt className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">
                    {venta.items.map((i) => i.nombre).join(", ")}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {venta.items.reduce((s, i) => s + i.cantidad, 0)} productos ·{" "}
                    {formatTime(venta.fecha)}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-gold">
                {formatCurrency(venta.total)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function RecentMovements({
  movimientos,
}: {
  movimientos: MovimientoStock[];
}) {
  const items = movimientos.slice(0, LIMITE);
  return (
    <Panel
      title="Movimientos de stock recientes"
      verMasHref="/inventory"
      mostrarVerMas={movimientos.length > LIMITE}
    >
      {items.length === 0 ? (
        <Empty label="No hay movimientos recientes." />
      ) : (
        <ul className="space-y-3">
          {items.map((mov) => {
            const positivo = mov.tipo === "entrada";
            return (
              <li key={mov.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {positivo ? (
                    <ArrowUpCircle className="h-5 w-5 shrink-0 text-emerald-400" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 shrink-0 text-red-400" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">
                      {mov.nombre} · {mov.codigo}
                    </p>
                    <p className="text-xs capitalize text-ink-soft">{mov.tipo}</p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-medium text-ink-soft">
                  {positivo ? "+" : "-"}
                  {Math.abs(mov.cantidad)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export function CriticalStockAlerts({ alertas }: { alertas: AlertaStock[] }) {
  const items = alertas.slice(0, LIMITE);

  return (
    <Panel
      title="Alertas de stock crítico"
      verMasHref="/inventory"
      mostrarVerMas={alertas.length > LIMITE}
    >
      {items.length === 0 ? (
        <Empty label="Todo el inventario está en niveles saludables." />
      ) : (
        <ul className="space-y-3">
          {items.map((alerta) => (
            <li
              key={`${alerta.tipo}-${alerta.id}`}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <AlertTriangle
                  className={
                    alerta.stock <= 0
                      ? "h-5 w-5 shrink-0 text-red-400"
                      : "h-5 w-5 shrink-0 text-accent"
                  }
                />
                <p className="truncate text-sm text-ink">
                  {alerta.nombre} · {alerta.codigo}
                  {alerta.tipo === "packaging" && (
                    <span className="ml-1.5 rounded bg-accent/15 px-1.5 py-0.5 text-[9px] font-medium text-accent">
                      Packaging
                    </span>
                  )}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-ink-soft">
                {alerta.stock} u.
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
