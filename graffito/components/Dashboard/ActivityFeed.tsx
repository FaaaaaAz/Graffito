import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Receipt } from "lucide-react";
import type { MovimientoStock, Venta } from "@/lib/types";
import type { StockRow } from "@/hooks/useInventory";
import { formatCurrency, formatTime, stockStatus } from "@/lib/utils";

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-panel-2 bg-panel p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-ink">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="py-6 text-center text-sm text-ink-soft">{label}</p>;
}

export function RecentSales({ ventas }: { ventas: Venta[] }) {
  const items = ventas.slice(0, 10);
  return (
    <Panel title="Últimas ventas">
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
                    {venta.items.map((i) => i.nombreProducto).join(", ")}
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
  const items = movimientos.slice(0, 10);
  return (
    <Panel title="Movimientos de stock recientes">
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
                      {mov.nombreProducto} · {mov.nombreVariante}
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

export function CriticalStockAlerts({ rows }: { rows: StockRow[] }) {
  const alertas = rows.filter(
    (row) => stockStatus(row.variante.stock, row.variante.stockMinimo) !== "en-stock"
  );

  return (
    <Panel title="Alertas de stock crítico">
      {alertas.length === 0 ? (
        <Empty label="Todo el inventario está en niveles saludables." />
      ) : (
        <ul className="space-y-3">
          {alertas.slice(0, 10).map((row) => (
            <li
              key={`${row.producto.id}-${row.variante.id}`}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <AlertTriangle
                  className={
                    row.variante.stock <= 0
                      ? "h-5 w-5 shrink-0 text-red-400"
                      : "h-5 w-5 shrink-0 text-accent"
                  }
                />
                <p className="truncate text-sm text-ink">
                  {row.producto.nombre} · {row.variante.nombre}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-ink-soft">
                {row.variante.stock} u.
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
